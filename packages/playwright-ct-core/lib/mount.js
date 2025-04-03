"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fixtures = void 0;
var _serializers = require("./injected/serializers");
var _router = require("./router");
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

let boundCallbacksForMount = [];
const fixtures = exports.fixtures = {
  _optionContextReuseMode: 'when-possible',
  serviceWorkers: 'block',
  page: async ({
    page
  }, use, info) => {
    if (!info._configInternal.defineConfigWasUsed) throw new Error('Component testing requires the use of the defineConfig() in your playwright-ct.config.{ts,js}: https://aka.ms/playwright/ct-define-config');
    await page._wrapApiCall(async () => {
      await page.exposeFunction('__ctDispatchFunction', (ordinal, args) => {
        boundCallbacksForMount[ordinal](...args);
      });
      await page.goto(process.env.PLAYWRIGHT_TEST_BASE_URL);
    }, true);
    await use(page);
  },
  mount: async ({
    page
  }, use) => {
    await use(async (componentRef, options) => {
      const selector = await page._wrapApiCall(async () => {
        return await innerMount(page, componentRef, options);
      }, true);
      const locator = page.locator(selector);
      return Object.assign(locator, {
        unmount: async () => {
          await locator.evaluate(async () => {
            const rootElement = document.getElementById('root');
            await window.playwrightUnmount(rootElement);
          });
        },
        update: async options => {
          if (isJsxComponent(options)) return await innerUpdate(page, options);
          await innerUpdate(page, componentRef, options);
        }
      });
    });
    boundCallbacksForMount = [];
  },
  router: async ({
    context,
    baseURL
  }, use) => {
    const router = new _router.Router(context, baseURL);
    await use(router);
    await router.dispose();
  }
};
function isJsxComponent(component) {
  return typeof component === 'object' && component && component.__pw_type === 'jsx';
}
async function innerUpdate(page, componentRef, options = {}) {
  const component = (0, _serializers.wrapObject)(createComponent(componentRef, options), boundCallbacksForMount);
  await page.evaluate(async ({
    component
  }) => {
    component = await window.__pwUnwrapObject(component);
    const rootElement = document.getElementById('root');
    return await window.playwrightUpdate(rootElement, component);
  }, {
    component
  });
}
async function innerMount(page, componentRef, options = {}) {
  const component = (0, _serializers.wrapObject)(createComponent(componentRef, options), boundCallbacksForMount);

  // WebKit does not wait for deferred scripts.
  await page.waitForFunction(() => !!window.playwrightMount);
  const selector = await page.evaluate(async ({
    component,
    hooksConfig
  }) => {
    component = await window.__pwUnwrapObject(component);
    hooksConfig = await window.__pwUnwrapObject(hooksConfig);
    let rootElement = document.getElementById('root');
    if (!rootElement) {
      rootElement = document.createElement('div');
      rootElement.id = 'root';
      document.body.appendChild(rootElement);
    }
    await window.playwrightMount(component, rootElement, hooksConfig);
    return '#root >> internal:control=component';
  }, {
    component,
    hooksConfig: options.hooksConfig
  });
  return selector;
}
function createComponent(component, options = {}) {
  if (component.__pw_type === 'jsx') return component;
  return {
    __pw_type: 'object-component',
    type: component,
    ...options
  };
}