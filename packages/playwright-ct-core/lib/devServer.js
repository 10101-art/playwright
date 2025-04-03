"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runDevServer = runDevServer;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _fsWatcher = require("playwright/lib/fsWatcher");
var _indexSource = require("./generated/indexSource");
var _viteUtils = require("./viteUtils");
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

async function runDevServer(config) {
  const {
    registerSourceFile,
    frameworkPluginFactory
  } = (0, _viteUtils.frameworkConfig)(config);
  const componentRegistry = new Map();
  await (0, _viteUtils.populateComponentsFromTests)(componentRegistry);
  const configDir = config.configFile ? _path.default.dirname(config.configFile) : config.rootDir;
  const dirs = await (0, _viteUtils.resolveDirs)(configDir, config);
  if (!dirs) {
    // eslint-disable-next-line no-console
    console.log(`Template file playwright/index.html is missing.`);
    return async () => {};
  }
  const registerSource = _indexSource.source + '\n' + (await _fs.default.promises.readFile(registerSourceFile, 'utf-8'));
  const viteConfig = await (0, _viteUtils.createConfig)(dirs, config, frameworkPluginFactory, false);
  viteConfig.plugins.push({
    name: 'playwright:component-index',
    async transform(content, id) {
      return (0, _viteUtils.transformIndexFile)(id, content, dirs.templateDir, registerSource, componentRegistry);
    }
  });
  const {
    createServer
  } = await import('vite');
  const devServer = await createServer(viteConfig);
  await devServer.listen();
  const protocol = viteConfig.server.https ? 'https:' : 'http:';
  // eslint-disable-next-line no-console
  console.log(`Dev Server listening on ${protocol}//${viteConfig.server.host || 'localhost'}:${viteConfig.server.port}`);
  const projectDirs = new Set();
  const projectOutputs = new Set();
  for (const p of config.projects) {
    projectDirs.add(p.testDir);
    projectOutputs.add(p.outputDir);
  }
  const globalWatcher = new _fsWatcher.Watcher(async () => {
    const registry = new Map();
    await (0, _viteUtils.populateComponentsFromTests)(registry);
    // compare componentRegistry to registry key sets.
    if (componentRegistry.size === registry.size && [...componentRegistry.keys()].every(k => registry.has(k))) return;

    // eslint-disable-next-line no-console
    console.log('List of components changed');
    componentRegistry.clear();
    for (const [k, v] of registry) componentRegistry.set(k, v);
    const id = _path.default.join(dirs.templateDir, 'index');
    const modules = [...devServer.moduleGraph.urlToModuleMap.values()];
    const rootModule = modules.find(m => {
      var _m$file, _m$file2;
      return ((_m$file = m.file) === null || _m$file === void 0 ? void 0 : _m$file.startsWith(id + '.ts')) || ((_m$file2 = m.file) === null || _m$file2 === void 0 ? void 0 : _m$file2.startsWith(id + '.js'));
    });
    if (rootModule) devServer.moduleGraph.onFileChange(rootModule.file);
  });
  await globalWatcher.update([...projectDirs], [...projectOutputs], false);
  return () => Promise.all([devServer.close(), globalWatcher.close()]).then(() => {});
}