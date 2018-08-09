import { JSReporters, TestInfo } from '@test-ui/core';
import { Test } from 'mocha';

export function normalizeTest(
  test: Pick<Test, 'title' | 'parent'>
): JSReporters.Test {
  return {
    id: test.title,
    name: test.title,
    fullName: [test.title],
    suiteName: test.parent ? test.parent.title : ''
  };
}

export function mochaTestToTestInfo(
  test: Pick<Test, 'title' | 'parent'>
): TestInfo {
  return {
    id: test.title,
    name: test.title,
    fullName: [test.title],
    suiteName: test.parent ? test.parent.title : ''
  };
}
