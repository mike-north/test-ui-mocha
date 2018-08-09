import { SuiteInfo } from '@test-ui/core';
import { Suite, Test } from 'mocha';
import { mochaTestToTestInfo } from './test';

export function mochaSuiteToTestSuite(
  mm: Pick<Suite, 'title'> & { tests: Array<Pick<Test, 'parent' | 'title'>> }
): SuiteInfo {
  return {
    id: mm.title,
    name: mm.title,
    fullName: [mm.title],
    tests: mm.tests.map(mochaTestToTestInfo),
    testCounts: {
      total: mm.tests.length
    }
  };
}
