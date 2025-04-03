"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Builtins = void 0;
exports.ensureBuiltins = ensureBuiltins;
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
/* eslint-disable no-restricted-globals */
// Make sure to update eslint.config.mjs when changing the list of builitins.
let Builtins = exports.Builtins = void 0;
function ensureBuiltins(global) {
  if (!global['__playwright_builtins__']) {
    var _global$setTimeout, _global$clearTimeout, _global$setInterval, _global$clearInterval, _global$requestAnimat, _global$cancelAnimati, _global$requestIdleCa, _global$cancelIdleCal, _global$eval;
    const builtins = {
      setTimeout: (_global$setTimeout = global.setTimeout) === null || _global$setTimeout === void 0 ? void 0 : _global$setTimeout.bind(global),
      clearTimeout: (_global$clearTimeout = global.clearTimeout) === null || _global$clearTimeout === void 0 ? void 0 : _global$clearTimeout.bind(global),
      setInterval: (_global$setInterval = global.setInterval) === null || _global$setInterval === void 0 ? void 0 : _global$setInterval.bind(global),
      clearInterval: (_global$clearInterval = global.clearInterval) === null || _global$clearInterval === void 0 ? void 0 : _global$clearInterval.bind(global),
      requestAnimationFrame: (_global$requestAnimat = global.requestAnimationFrame) === null || _global$requestAnimat === void 0 ? void 0 : _global$requestAnimat.bind(global),
      cancelAnimationFrame: (_global$cancelAnimati = global.cancelAnimationFrame) === null || _global$cancelAnimati === void 0 ? void 0 : _global$cancelAnimati.bind(global),
      requestIdleCallback: (_global$requestIdleCa = global.requestIdleCallback) === null || _global$requestIdleCa === void 0 ? void 0 : _global$requestIdleCa.bind(global),
      cancelIdleCallback: (_global$cancelIdleCal = global.cancelIdleCallback) === null || _global$cancelIdleCal === void 0 ? void 0 : _global$cancelIdleCal.bind(global),
      performance: global.performance,
      eval: (_global$eval = global.eval) === null || _global$eval === void 0 ? void 0 : _global$eval.bind(global),
      Intl: global.Intl,
      Date: global.Date,
      Map: global.Map,
      Set: global.Set
    };
    Object.defineProperty(global, '__playwright_builtins__', {
      value: builtins,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }
  return global['__playwright_builtins__'];
}