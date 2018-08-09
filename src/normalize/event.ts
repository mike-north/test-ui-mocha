import {
  JSReporters,
  RunEndEvent,
  RunStartEvent,
  SuiteEndEvent,
  SuiteStartEvent,
  TestEndEvent,
  TestStartEvent
} from '@test-ui/core';
import { Suite, Test } from 'mocha';
import { mochaSuiteToTestSuite } from './suite';
import { normalizeTest } from './test';

export interface AssertionError {
  actual: any;
  expected: any;
  message: string;
  showDiff: boolean;
  stack: string;
}
export interface TestRunData {
  passed: number;
  failed: number;
  errors: AssertionError[];
}

export interface SuiteRunData {
  childModules: SuiteRunData[];
  testData: TestRunData[];
}

interface AggregateTestData {
  runtime: number;
  testCounts: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    todo: number;
  };
}

export type SemiTest = Pick<Test, 'title' | 'state' | 'duration'>;
export type SemiSuite = Pick<Suite, 'title' | 'total' | 'fullTitle'> & {
  suites: SemiSuite[];
  tests: SemiTest[];
};

function aggregateTestData(suite: SemiSuite): AggregateTestData {
  const childSuiteData: AggregateTestData[] = suite.suites.map(
    aggregateTestData
  );
  const thisSuiteData = suite.tests.reduce(
    (d, tst) => {
      if (tst.state === 'passed') d.testCounts.passed++;
      else if (tst.state === 'failed') d.testCounts.failed++;
      else d.testCounts.skipped++;
      if (typeof tst.duration !== 'undefined') d.runtime += tst.duration;
      return d;
    },
    {
      runtime: 0,
      testCounts: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        todo: 0
      }
    }
  );
  return childSuiteData.concat([thisSuiteData]).reduce(
    (dat, suiteDat) => {
      dat.runtime += suiteDat.runtime;
      dat.testCounts.failed += suiteDat.testCounts.failed;
      dat.testCounts.passed += suiteDat.testCounts.passed;
      dat.testCounts.skipped += suiteDat.testCounts.skipped;
      dat.testCounts.todo += suiteDat.testCounts.todo;
      dat.testCounts.total += suiteDat.testCounts.total;
      return dat;
    },
    {
      runtime: 0,
      testCounts: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        todo: 0
      }
    }
  );
}

function makeRunStart(suite: SemiSuite): JSReporters.SuiteStart {
  return makeSuiteStart(suite);
}
function makeRunEnd(suite: SemiSuite): JSReporters.SuiteEnd {
  return makeSuiteEnd(suite);
}
function makeSuiteStart(suite: SemiSuite): JSReporters.SuiteStart {
  return {
    name: suite.title,
    fullName: [suite.fullTitle()], // TODO: supposedly mocha has a suite.titlePath()
    tests: suite.tests.map(normalizeTest),
    childSuites: suite.suites.map(mochaSuiteToTestSuite),
    testCounts: {
      total: suite.total()
    }
  };
}
function makeSuiteEnd(suite: SemiSuite): JSReporters.SuiteEnd {
  const start = makeRunStart(suite);
  const { testCounts, runtime } = aggregateTestData(suite);
  return {
    ...start,
    status: testCounts.failed === 0 ? 'passed' : 'failed',
    runtime,
    testCounts
  };
}
function makeTestStart(test: Test): JSReporters.TestStart {
  return {
    name: test.title,
    fullName: [test.fullTitle()],
    suiteName: test.parent ? test.parent.title : ''
  };
}
function makeTestEnd(test: Test, data: TestRunData): JSReporters.TestEnd {
  const start = makeTestStart(test);
  return {
    ...start,
    status: test.state === 'passed' ? 'passed' : 'failed',
    runtime: test.duration || 0,
    errors: data.errors.map(e => ({ ...e, passed: false, todo: false })), // TODO
    assertions: [] // Not available in Mocha
  };
}

export function normalizeRunStartEvent(rootSuite: SemiSuite): RunStartEvent {
  return {
    event: 'runStart',
    data: makeRunStart(rootSuite)
  };
}

export function normalizeRunEndEvent(rootSuite: SemiSuite): RunEndEvent {
  return {
    event: 'runEnd',
    data: makeRunEnd(rootSuite)
  };
}
export function normalizeSuiteStartEvent(suite: SemiSuite): SuiteStartEvent {
  return {
    event: 'suiteStart',
    data: makeSuiteStart(suite)
  };
}

export function normalizeSuiteEndEvent(suite: SemiSuite): SuiteEndEvent {
  return {
    event: 'suiteEnd',
    data: makeSuiteEnd(suite)
  };
}
export function normalizeTestStartEvent(test: Test): TestStartEvent {
  return {
    event: 'testStart',
    data: makeTestStart(test)
  };
}

export function normalizeTestEndEvent(
  test: Test,
  data: TestRunData
): TestEndEvent {
  return {
    event: 'testEnd',
    data: makeTestEnd(test, data)
  };
}
