"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPageBindingScript = createPageBindingScript;
exports.deliverBindingResult = deliverBindingResult;
exports.takeBindingHandle = takeBindingHandle;
var _builtins = require("./isomorphic/builtins");
var _utilityScriptSerializers = require("./isomorphic/utilityScriptSerializers");
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

function addPageBinding(playwrightBinding, bindingName, needsHandle, utilityScriptSerializersFactory, builtins) {
  const {
    serializeAsCallArgument
  } = utilityScriptSerializersFactory(builtins);
  // eslint-disable-next-line no-restricted-globals
  const binding = globalThis[playwrightBinding];
  // eslint-disable-next-line no-restricted-globals
  globalThis[bindingName] = (...args) => {
    // eslint-disable-next-line no-restricted-globals
    const me = globalThis[bindingName];
    if (needsHandle && args.slice(1).some(arg => arg !== undefined)) throw new Error(`exposeBindingHandle supports a single argument, ${args.length} received`);
    let callbacks = me['callbacks'];
    if (!callbacks) {
      callbacks = new builtins.Map();
      me['callbacks'] = callbacks;
    }
    const seq = (me['lastSeq'] || 0) + 1;
    me['lastSeq'] = seq;
    let handles = me['handles'];
    if (!handles) {
      handles = new builtins.Map();
      me['handles'] = handles;
    }
    const promise = new Promise((resolve, reject) => callbacks.set(seq, {
      resolve,
      reject
    }));
    let payload;
    if (needsHandle) {
      handles.set(seq, args[0]);
      payload = {
        name: bindingName,
        seq
      };
    } else {
      const serializedArgs = [];
      for (let i = 0; i < args.length; i++) {
        serializedArgs[i] = serializeAsCallArgument(args[i], v => {
          return {
            fallThrough: v
          };
        });
      }
      payload = {
        name: bindingName,
        seq,
        serializedArgs
      };
    }
    binding(JSON.stringify(payload));
    return promise;
  };
  // eslint-disable-next-line no-restricted-globals
  globalThis[bindingName].__installed = true;
}
function takeBindingHandle(arg) {
  // eslint-disable-next-line no-restricted-globals
  const handles = globalThis[arg.name]['handles'];
  const handle = handles.get(arg.seq);
  handles.delete(arg.seq);
  return handle;
}
function deliverBindingResult(arg) {
  // eslint-disable-next-line no-restricted-globals
  const callbacks = globalThis[arg.name]['callbacks'];
  if ('error' in arg) callbacks.get(arg.seq).reject(arg.error);else callbacks.get(arg.seq).resolve(arg.result);
  callbacks.delete(arg.seq);
}
function createPageBindingScript(playwrightBinding, name, needsHandle) {
  return `(${addPageBinding.toString()})(${JSON.stringify(playwrightBinding)}, ${JSON.stringify(name)}, ${needsHandle}, (${_utilityScriptSerializers.source}), (${_builtins.ensureBuiltins})(globalThis))`;
}