"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformObject = transformObject;
exports.transformObjectAsync = transformObjectAsync;
exports.unwrapObject = unwrapObject;
exports.wrapObject = wrapObject;
var _importRegistry = require("./importRegistry");
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

function isFunctionRef(value) {
  return value && typeof value === 'object' && value.__pw_type === 'function';
}
function wrapObject(value, callbacks) {
  return transformObject(value, v => {
    if (typeof v === 'function') {
      const ordinal = callbacks.length;
      callbacks.push(v);
      const result = {
        __pw_type: 'function',
        ordinal
      };
      return {
        result
      };
    }
  });
}
async function unwrapObject(value) {
  return transformObjectAsync(value, async v => {
    if (isFunctionRef(v)) {
      const result = (...args) => {
        window.__ctDispatchFunction(v.ordinal, args);
      };
      return {
        result
      };
    }
    if ((0, _importRegistry.isImportRef)(v)) return {
      result: await window.__pwRegistry.resolveImportRef(v)
    };
  });
}
function transformObject(value, mapping) {
  const result = mapping(value);
  if (result) return result.result;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date || value instanceof RegExp || value instanceof URL) return value;
  if (Array.isArray(value)) {
    const result = [];
    for (const item of value) result.push(transformObject(item, mapping));
    return result;
  }
  if ((value === null || value === void 0 ? void 0 : value.__pw_type) === 'jsx' && typeof value.type === 'function') {
    throw new Error([`Component "${value.type.name}" cannot be mounted.`, `Most likely, this component is defined in the test file. Create a test story instead.`, `For more information, see https://playwright.dev/docs/test-components#test-stories.`].join('\n'));
  }
  const result2 = {};
  for (const [key, prop] of Object.entries(value)) result2[key] = transformObject(prop, mapping);
  return result2;
}
async function transformObjectAsync(value, mapping) {
  const result = await mapping(value);
  if (result) return result.result;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date || value instanceof RegExp || value instanceof URL) return value;
  if (Array.isArray(value)) {
    const result = [];
    for (const item of value) result.push(await transformObjectAsync(item, mapping));
    return result;
  }
  const result2 = {};
  for (const [key, prop] of Object.entries(value)) result2[key] = await transformObjectAsync(prop, mapping);
  return result2;
}