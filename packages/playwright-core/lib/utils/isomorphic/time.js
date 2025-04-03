"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monotonicTime = monotonicTime;
exports.setTimeOrigin = setTimeOrigin;
exports.timeOrigin = timeOrigin;
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

let _timeOrigin = performance.timeOrigin;
let _timeShift = 0;
function setTimeOrigin(origin) {
  _timeOrigin = origin;
  _timeShift = performance.timeOrigin - origin;
}
function timeOrigin() {
  return _timeOrigin;
}
function monotonicTime() {
  return Math.floor((performance.now() + _timeShift) * 1000) / 1000;
}