"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildBundle = buildBundle;
exports.createPlugin = createPlugin;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _compilationCache = require("playwright/lib/transform/compilationCache");
var _transform = require("playwright/lib/transform/transform");
var _util = require("playwright/lib/util");
var _utilsBundle = require("playwright/lib/utilsBundle");
var _utils = require("playwright-core/lib/utils");
var _utilsBundle2 = require("playwright-core/lib/utilsBundle");
var _devServer = require("./devServer");
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

const log = (0, _utilsBundle2.debug)('pw:vite');
let stoppableServer;
const playwrightVersion = (0, _utils.getPlaywrightVersion)();
function createPlugin() {
  let configDir;
  let config;
  return {
    name: 'playwright-vite-plugin',
    setup: async (configObject, configDirectory) => {
      config = configObject;
      configDir = configDirectory;
    },
    begin: async suite => {
      const result = await buildBundle(config, configDir);
      if (!result) return;
      const {
        viteConfig
      } = result;
      const {
        preview
      } = await import('vite');
      const previewServer = await preview(viteConfig);
      stoppableServer = (0, _utilsBundle.stoppable)(previewServer.httpServer, 0);
      const isAddressInfo = x => x === null || x === void 0 ? void 0 : x.address;
      const address = previewServer.httpServer.address();
      if (isAddressInfo(address)) {
        const protocol = viteConfig.preview.https ? 'https:' : 'http:';
        process.env.PLAYWRIGHT_TEST_BASE_URL = `${protocol}//${viteConfig.preview.host}:${address.port}`;
      }
    },
    end: async () => {
      if (stoppableServer) await new Promise(f => stoppableServer.stop(f));
    },
    populateDependencies: async () => {
      await buildBundle(config, configDir);
    },
    startDevServer: async () => {
      return await (0, _devServer.runDevServer)(config);
    },
    clearCache: async () => {
      const configDir = config.configFile ? _path.default.dirname(config.configFile) : config.rootDir;
      const dirs = await (0, _viteUtils.resolveDirs)(configDir, config);
      if (dirs) await (0, _util.removeDirAndLogToConsole)(dirs.outDir);
    }
  };
}
async function buildBundle(config, configDir) {
  const {
    registerSourceFile,
    frameworkPluginFactory
  } = (0, _viteUtils.frameworkConfig)(config);
  {
    // Detect a running dev server and use it if available.
    const endpoint = (0, _viteUtils.resolveEndpoint)(config);
    const protocol = endpoint.https ? 'https:' : 'http:';
    const url = new URL(`${protocol}//${endpoint.host}:${endpoint.port}`);
    if (await (0, _utils.isURLAvailable)(url, true)) {
      // eslint-disable-next-line no-console
      console.log(`Dev Server is already running at ${url.toString()}, using it.\n`);
      process.env.PLAYWRIGHT_TEST_BASE_URL = url.toString();
      return null;
    }
  }
  const dirs = await (0, _viteUtils.resolveDirs)(configDir, config);
  if (!dirs) {
    // eslint-disable-next-line no-console
    console.log(`Template file playwright/index.html is missing.`);
    return null;
  }
  const buildInfoFile = _path.default.join(dirs.outDir, 'metainfo.json');
  let buildExists = false;
  let buildInfo;
  const registerSource = _indexSource.source + '\n' + (await _fs.default.promises.readFile(registerSourceFile, 'utf-8'));
  const registerSourceHash = (0, _utils.calculateSha1)(registerSource);
  const {
    version: viteVersion,
    build,
    mergeConfig
  } = await import('vite');
  try {
    buildInfo = JSON.parse(await _fs.default.promises.readFile(buildInfoFile, 'utf-8'));
    (0, _utils.assert)(buildInfo.version === playwrightVersion);
    (0, _utils.assert)(buildInfo.viteVersion === viteVersion);
    (0, _utils.assert)(buildInfo.registerSourceHash === registerSourceHash);
    buildExists = true;
  } catch (e) {
    buildInfo = {
      version: playwrightVersion,
      viteVersion,
      registerSourceHash,
      components: [],
      sources: {},
      deps: {}
    };
  }
  log('build exists:', buildExists);
  const componentRegistry = new Map();
  const componentsByImportingFile = new Map();
  // 1. Populate component registry based on tests' component imports.
  await (0, _viteUtils.populateComponentsFromTests)(componentRegistry, componentsByImportingFile);

  // 2. Check if the set of required components has changed.
  const hasNewComponents = await checkNewComponents(buildInfo, componentRegistry);
  log('has new components:', hasNewComponents);

  // 3. Check component sources.
  const sourcesDirty = !buildExists || hasNewComponents || (await checkSources(buildInfo));
  log('sourcesDirty:', sourcesDirty);

  // 4. Update component info.
  buildInfo.components = [...componentRegistry.values()];
  const jsxInJS = (0, _viteUtils.hasJSComponents)(buildInfo.components);
  const viteConfig = await (0, _viteUtils.createConfig)(dirs, config, frameworkPluginFactory, jsxInJS);
  if (sourcesDirty) {
    // Only add our own plugin when we actually build / transform.
    log('build');
    const depsCollector = new Map();
    const buildConfig = mergeConfig(viteConfig, {
      plugins: [vitePlugin(registerSource, dirs.templateDir, buildInfo, componentRegistry, depsCollector)]
    });
    await build(buildConfig);
    buildInfo.deps = Object.fromEntries(depsCollector.entries());
  }
  {
    // Update dependencies based on the vite build.
    for (const [importingFile, components] of componentsByImportingFile) {
      const deps = new Set();
      for (const component of components) {
        for (const d of buildInfo.deps[component]) deps.add(d);
      }
      (0, _compilationCache.setExternalDependencies)(importingFile, [...deps]);
    }
  }
  if (hasNewComponents || sourcesDirty) {
    log('write manifest');
    await _fs.default.promises.writeFile(buildInfoFile, JSON.stringify(buildInfo, undefined, 2));
  }
  return {
    buildInfo,
    viteConfig
  };
}
async function checkSources(buildInfo) {
  for (const [source, sourceInfo] of Object.entries(buildInfo.sources)) {
    try {
      const timestamp = (await _fs.default.promises.stat(source)).mtimeMs;
      if (sourceInfo.timestamp !== timestamp) {
        log('source has changed:', source);
        return true;
      }
    } catch (e) {
      log('check source failed:', e);
      return true;
    }
  }
  return false;
}
async function checkNewComponents(buildInfo, componentRegistry) {
  const newComponents = [...componentRegistry.keys()];
  const oldComponents = new Map(buildInfo.components.map(c => [c.id, c]));
  let hasNewComponents = false;
  for (const c of newComponents) {
    if (!oldComponents.has(c)) {
      hasNewComponents = true;
      break;
    }
  }
  for (const c of oldComponents.values()) componentRegistry.set(c.id, c);
  return hasNewComponents;
}
function vitePlugin(registerSource, templateDir, buildInfo, importInfos, depsCollector) {
  buildInfo.sources = {};
  let moduleResolver;
  return {
    name: 'playwright:component-index',
    configResolved(config) {
      moduleResolver = config.createResolver();
    },
    async transform(content, id) {
      const queryIndex = id.indexOf('?');
      const file = queryIndex !== -1 ? id.substring(0, queryIndex) : id;
      if (!buildInfo.sources[file]) {
        try {
          const timestamp = (await _fs.default.promises.stat(file)).mtimeMs;
          buildInfo.sources[file] = {
            timestamp
          };
        } catch {
          // Silent if can't read the file.
        }
      }
      return (0, _viteUtils.transformIndexFile)(id, content, templateDir, registerSource, importInfos);
    },
    async writeBundle() {
      for (const importInfo of importInfos.values()) {
        const importPath = (0, _transform.resolveHook)(importInfo.filename, importInfo.importSource);
        if (!importPath) continue;
        const deps = new Set();
        const id = await moduleResolver(importPath);
        if (!id) continue;
        collectViteModuleDependencies(this, id, deps);
        depsCollector.set(importPath, [...deps]);
      }
    }
  };
}
function collectViteModuleDependencies(context, id, deps) {
  if (!_path.default.isAbsolute(id)) return;
  const normalizedId = _path.default.normalize(id);
  if (deps.has(normalizedId)) return;
  deps.add(normalizedId);
  const module = context.getModuleInfo(id);
  for (const importedId of (module === null || module === void 0 ? void 0 : module.importedIds) || []) collectViteModuleDependencies(context, importedId, deps);
  for (const importedId of (module === null || module === void 0 ? void 0 : module.dynamicallyImportedIds) || []) collectViteModuleDependencies(context, importedId, deps);
}