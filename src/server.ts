import { Server, State, StateReference, SuitePredicate } from '@test-ui/core';
import { toPredicate } from 'object-predicate';
import {
  SuiteRunData,
  TestRunData,
  normalizeRunEndEvent,
  normalizeRunStartEvent,
  normalizeSuiteEndEvent,
  normalizeSuiteStartEvent,
  normalizeTestEndEvent,
  normalizeTestStartEvent
} from './normalize/event';
import { mochaSuiteToTestSuite } from './normalize/suite';

// tslint:disable-next-line:no-namespace
namespace MochaTestServer {
  export interface Options extends Server.Options {}
}

class MochaTestServer extends Server {
  runner?: Mocha.Runner;
  constructor(public mocha: Mocha, opts: MochaTestServer.Options) {
    super(opts);
    this.log.pushPrefix('☕️');
  }

  setupRunner(runner: Mocha.Runner) {
    this.log.debug('setting up runner');
    let runData: SuiteRunData;
    let currentSuiteData: SuiteRunData[] = [];
    let currentTestData: TestRunData | undefined;
    runner.on('start', () => {
      return this.sendTestData(normalizeRunStartEvent(runner.suite));
    });
    runner.on('end', () => {
      this.log.log('Assertion Data: ', runData);
      return this.sendTestData(normalizeRunEndEvent(runner.suite));
    });
    runner.on('suite', suite => {
      const thisSuiteData: SuiteRunData = {
        childModules: [],
        testData: []
      };
      if (suite.root) runData = thisSuiteData;
      else {
        currentSuiteData[currentSuiteData.length - 1].childModules.push(
          thisSuiteData
        );
      }
      currentSuiteData.push(thisSuiteData);
      return this.sendTestData(normalizeSuiteStartEvent(suite));
    });
    runner.on('suite end', suite => {
      const data = currentSuiteData.pop();
      if (!data) throw new Error('no data!');
      return this.sendTestData(normalizeSuiteEndEvent(suite));
    });
    runner.on('test', test => {
      const thisTestData = {
        passed: 0,
        failed: 0,
        errors: []
      };
      currentTestData = thisTestData;
      const thisSuite = currentSuiteData[currentSuiteData.length - 1];
      if (!thisSuite) {
        throw new Error('"test" event emitted before "suite" event!');
      }
      thisSuite.testData.push(thisTestData);
      return this.sendTestData(normalizeTestStartEvent(test));
    });
    runner.on('test end', test => {
      const data = currentTestData;
      if (!data) throw new Error('no test data!');
      return this.sendTestData(normalizeTestEndEvent(test, data));
    });
    runner.on('pass', _test => {
      // tslint:disable-next-line:no-unused-expression
      currentTestData && currentTestData.passed++;
    });
    runner.on('fail', (_test, err) => {
      // tslint:disable-next-line:no-unused-expression
      currentTestData && currentTestData.failed++;
      // tslint:disable-next-line:no-unused-expression
      currentTestData &&
        currentTestData.errors.push({ ...err, stack: err.stack });
    });
  }
  protected async boot(): Promise<StateReference | undefined> {
    return;
  }
  protected async prepareEnvironment(
    state: State
  ): Promise<{ ready: boolean }> {
    // Somewhere, sometime, notify the client that the server is prepared
    (await this.conn).notifyIsPrepared(state);
    return { ready: true };
  }
  protected async runTests(moduleFilter?: SuitePredicate): Promise<void> {
    this.log.debug('startTests');
    if (moduleFilter) {
      this.log.debug('🔍applying module filter', moduleFilter);
      let pred =
        typeof moduleFilter === 'function'
          ? moduleFilter
          : toPredicate(moduleFilter);
      const totModules = mocha.suite.suites.length;
      mocha.suite.suites = mocha.suite.suites.filter(mm =>
        pred(mochaSuiteToTestSuite(mm))
      );
      const selectedModules = mocha.suite.suites.length;
      this.log
        .txt('Enabled ')
        .bgPurple.white.css(
          'border-radius: 0.7rem; padding: 2px 8px; margin: 5px 0; border: 3px solid yellow'
        )
        .log(selectedModules + ' of ' + totModules + ' modules');
    }
    this.runner = new Mocha.Runner(mocha.suite, false);
    this.setupRunner(this.runner);
    this.log.debug('beginning test run');
    this.runner.run();
    // Emit send test results back to the client
  }
}
export default MochaTestServer;
