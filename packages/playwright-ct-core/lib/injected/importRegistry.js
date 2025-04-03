"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ImportRegistry = void 0;
exports.isImportRef = isImportRef;
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

function isImportRef(value) {
  return typeof value === 'object' && value && value.__pw_type === 'importRef';
}
class ImportRegistry {
  constructor() {
    this._registry = new Map();
  }
  initialize(components) {
    for (const [name, value] of Object.entries(components)) this._registry.set(name, value);
  }
  async resolveImportRef(importRef) {
    const importFunction = this._registry.get(importRef.id);
    if (!importFunction) throw new Error(`Unregistered component: ${importRef.id}. Following components are registered: ${[...this._registry.keys()]}`);
    let importedObject = await importFunction();
    if (!importedObject) throw new Error(`Could not resolve component: ${importRef.id}.`);
    if (importRef.property) {
      importedObject = importedObject[importRef.property];
      if (!importedObject) throw new Error(`Could not instantiate component: ${importRef.id}.${importRef.property}.`);
    }
    return importedObject;
  }
}
exports.ImportRegistry = ImportRegistry;