"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class MarkdownReporter {
  constructor(options) {
    this._options = void 0;
    this._fatalErrors = [];
    this._config = void 0;
    this._suite = void 0;
    this._options = options;
  }
  printsToStdio() {
    return false;
  }
  onBegin(config, suite) {
    this._config = config;
    this._suite = suite;
  }
  onError(error) {
    this._fatalErrors.push(error);
  }
  async onEnd(result) {
    const summary = this._generateSummary();
    const lines = [];
    if (this._fatalErrors.length) lines.push(`**${this._fatalErrors.length} fatal errors, not part of any test**`);
    if (summary.unexpected.length) {
      lines.push(`**${summary.unexpected.length} failed**`);
      this._printTestList(':x:', summary.unexpected, lines);
    }
    if (summary.flaky.length) {
      lines.push(`<details>`);
      lines.push(`<summary><b>${summary.flaky.length} flaky</b></summary>`);
      this._printTestList(':warning:', summary.flaky, lines, ' <br/>');
      lines.push(`</details>`);
      lines.push(``);
    }
    if (summary.interrupted.length) {
      lines.push(`<details>`);
      lines.push(`<summary><b>${summary.interrupted.length} interrupted</b></summary>`);
      this._printTestList(':warning:', summary.interrupted, lines, ' <br/>');
      lines.push(`</details>`);
      lines.push(``);
    }
    const skipped = summary.skipped ? `, ${summary.skipped} skipped` : '';
    const didNotRun = summary.didNotRun ? `, ${summary.didNotRun} did not run` : '';
    lines.push(`**${summary.expected} passed${skipped}${didNotRun}**`);
    lines.push(`:heavy_check_mark::heavy_check_mark::heavy_check_mark:`);
    lines.push(``);
    await this.publishReport(lines.join('\n'));
  }
  async publishReport(report) {
    const maybeRelativeFile = this._options.outputFile || 'report.md';
    const reportFile = _path.default.resolve(this._options.configDir, maybeRelativeFile);
    await _fs.default.promises.mkdir(_path.default.dirname(reportFile), {
      recursive: true
    });
    await _fs.default.promises.writeFile(reportFile, report);
  }
  _generateSummary() {
    let didNotRun = 0;
    let skipped = 0;
    let expected = 0;
    const interrupted = [];
    const interruptedToPrint = [];
    const unexpected = [];
    const flaky = [];
    this._suite.allTests().forEach(test => {
      switch (test.outcome()) {
        case 'skipped':
          {
            if (test.results.some(result => result.status === 'interrupted')) {
              if (test.results.some(result => !!result.error)) interruptedToPrint.push(test);
              interrupted.push(test);
            } else if (!test.results.length || test.expectedStatus !== 'skipped') {
              ++didNotRun;
            } else {
              ++skipped;
            }
            break;
          }
        case 'expected':
          ++expected;
          break;
        case 'unexpected':
          unexpected.push(test);
          break;
        case 'flaky':
          flaky.push(test);
          break;
      }
    });
    return {
      didNotRun,
      skipped,
      expected,
      interrupted,
      unexpected,
      flaky
    };
  }
  _printTestList(prefix, tests, lines, suffix) {
    for (const test of tests) lines.push(`${prefix} ${formatTestTitle(this._config.rootDir, test)}${suffix || ''}`);
    lines.push(``);
  }
}
function formatTestTitle(rootDir, test) {
  // root, project, file, ...describes, test
  const [, projectName,, ...titles] = test.titlePath();
  const relativeTestPath = _path.default.relative(rootDir, test.location.file);
  const location = `${relativeTestPath}:${test.location.line}:${test.location.column}`;
  const projectTitle = projectName ? `[${projectName}] › ` : '';
  const testTitle = `${projectTitle}${location} › ${titles.join(' › ')}`;
  const extraTags = test.tags.filter(t => !testTitle.includes(t));
  return `${testTitle}${extraTags.length ? ' ' + extraTags.join(' ') : ''}`;
}
var _default = exports.default = MarkdownReporter;