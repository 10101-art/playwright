"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createConfig = createConfig;
exports.frameworkConfig = frameworkConfig;
exports.hasJSComponents = hasJSComponents;
exports.populateComponentsFromTests = populateComponentsFromTests;
exports.resolveDirs = resolveDirs;
exports.resolveEndpoint = resolveEndpoint;
exports.transformIndexFile = transformIndexFile;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _compilationCache = require("playwright/lib/transform/compilationCache");
var _transform = require("playwright/lib/transform/transform");
var _utilsBundle = require("playwright-core/lib/utilsBundle");
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

const log = (0, _utilsBundle.debug)('pw:vite');
async function resolveDirs(configDir, config) {
  const use = config.projects[0].use;
  // FIXME: use build plugin to determine html location to resolve this.
  // TemplateDir must be relative, otherwise we can't move the final index.html into its target location post-build.
  // This regressed in https://github.com/microsoft/playwright/pull/26526
  const relativeTemplateDir = use.ctTemplateDir || 'playwright';
  const templateDir = await _fs.default.promises.realpath(_path.default.normalize(_path.default.join(configDir, relativeTemplateDir))).catch(() => undefined);
  if (!templateDir) return null;
  const outDir = use.ctCacheDir ? _path.default.resolve(configDir, use.ctCacheDir) : _path.default.resolve(templateDir, '.cache');
  return {
    configDir,
    outDir,
    templateDir
  };
}
function resolveEndpoint(config) {
  const use = config.projects[0].use;
  const baseURL = new URL(use.baseURL || 'http://localhost');
  return {
    https: baseURL.protocol.startsWith('https:') ? {} : undefined,
    host: baseURL.hostname,
    port: use.ctPort || Number(baseURL.port) || 3100
  };
}
async function createConfig(dirs, config, frameworkPluginFactory, supportJsxInJs) {
  var _baseAndUserConfig$pl;
  // We are going to have 3 config files:
  // - the defaults that user config overrides (baseConfig)
  // - the user config (userConfig)
  // - frameworks overrides (frameworkOverrides);

  const endpoint = resolveEndpoint(config);
  const use = config.projects[0].use;

  // Compose base config from the playwright config only.
  const baseConfig = {
    root: dirs.templateDir,
    configFile: false,
    publicDir: _path.default.join(dirs.configDir, 'public'),
    define: {
      __VUE_PROD_DEVTOOLS__: true
    },
    css: {
      devSourcemap: true
    },
    build: {
      outDir: dirs.outDir
    },
    preview: endpoint,
    server: endpoint,
    // Vite preview server will otherwise always return the index.html with 200.
    appType: 'mpa'
  };

  // Vite 5 refuses to support CJS.
  const {
    mergeConfig
  } = await import('vite');

  // Apply user config on top of the base config. This could have changed root and build.outDir.
  const userConfig = typeof use.ctViteConfig === 'function' ? await use.ctViteConfig() : use.ctViteConfig || {};
  const baseAndUserConfig = mergeConfig(baseConfig, userConfig);
  const frameworkOverrides = {
    plugins: []
  };

  // React heuristic. If we see a component in a file with .js extension,
  // consider it a potential JSX-in-JS scenario and enable JSX loader for all
  // .js files.
  if (supportJsxInJs) {
    log('jsx-in-js detected');
    frameworkOverrides.esbuild = {
      loader: 'jsx',
      include: /.*\.jsx?$/,
      exclude: []
    };
    frameworkOverrides.optimizeDeps = {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    };
  }
  frameworkOverrides.build = {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      treeshake: false,
      input: {
        index: _path.default.join(dirs.templateDir, 'index.html')
      }
    },
    sourcemap: true
  };

  // We assume that any non-empty plugin list includes `vite-react` or similar.
  if (frameworkPluginFactory && !((_baseAndUserConfig$pl = baseAndUserConfig.plugins) !== null && _baseAndUserConfig$pl !== void 0 && _baseAndUserConfig$pl.length)) frameworkOverrides.plugins = [await frameworkPluginFactory()];
  return mergeConfig(baseAndUserConfig, frameworkOverrides);
}
async function populateComponentsFromTests(componentRegistry, componentsByImportingFile) {
  const importInfos = await (0, _compilationCache.getUserData)('playwright-ct-core');
  for (const [file, importList] of importInfos) {
    for (const importInfo of importList) componentRegistry.set(importInfo.id, importInfo);
    if (componentsByImportingFile) componentsByImportingFile.set(file, importList.map(i => (0, _transform.resolveHook)(i.filename, i.importSource)).filter(Boolean));
  }
}
function hasJSComponents(components) {
  for (const component of components) {
    const importPath = (0, _transform.resolveHook)(component.filename, component.importSource);
    const extname = importPath ? _path.default.extname(importPath) : '';
    if (extname === '.js' || importPath && !extname && _fs.default.existsSync(importPath + '.js')) return true;
  }
  return false;
}
const importReactRE = /(^|\n|;)import\s+(\*\s+as\s+)?React(,|\s+)/;
const compiledReactRE = /(const|var)\s+React\s*=/;
function transformIndexFile(id, content, templateDir, registerSource, importInfos) {
  // Vite React plugin will do this for .jsx files, but not .js files.
  if (id.endsWith('.js') && content.includes('React.createElement') && !content.match(importReactRE) && !content.match(compiledReactRE)) {
    const code = `import React from 'react';\n${content}`;
    return {
      code,
      map: {
        mappings: ''
      }
    };
  }
  const indexTs = _path.default.join(templateDir, 'index.ts');
  const indexTsx = _path.default.join(templateDir, 'index.tsx');
  const indexJs = _path.default.join(templateDir, 'index.js');
  const indexJsx = _path.default.join(templateDir, 'index.jsx');
  const idResolved = _path.default.resolve(id);
  if (!idResolved.endsWith(indexTs) && !idResolved.endsWith(indexTsx) && !idResolved.endsWith(indexJs) && !idResolved.endsWith(indexJsx)) return null;
  const lines = [content, ''];
  lines.push(registerSource);
  for (const value of importInfos.values()) {
    const importPath = (0, _transform.resolveHook)(value.filename, value.importSource) || value.importSource;
    lines.push(`const ${value.id} = () => import('${importPath === null || importPath === void 0 ? void 0 : importPath.replaceAll(_path.default.sep, '/')}').then((mod) => mod.${value.remoteName || 'default'});`);
  }
  lines.push(`__pwRegistry.initialize({ ${[...importInfos.keys()].join(',\n  ')} });`);
  return {
    code: lines.join('\n'),
    map: {
      mappings: ''
    }
  };
}
function frameworkConfig(config) {
  return config['@playwright/experimental-ct-core'];
}