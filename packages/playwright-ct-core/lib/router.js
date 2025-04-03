"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Router = void 0;
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

let lastRequestId = 0;
let fetchOverrideCounter = 0;
const currentlyInterceptingInContexts = new Map();
const originalFetch = globalThis.fetch;
async function executeRequestHandlers(request, handlers, baseUrl) {
  const requestId = String(++lastRequestId);
  const resolutionContext = {
    baseUrl
  };
  for (const handler of handlers) {
    const result = await handler.run({
      request,
      requestId,
      resolutionContext
    });
    if (result !== null && result !== void 0 && result.response) return result.response;
  }
}
function isMswRequestPassthrough(headers) {
  var _headers$get;
  if (headers.get('x-msw-intention') === 'bypass') return true;
  // After MSW v2.6.4
  // https://github.com/mswjs/msw/commit/2fa98c327acc51189f87789d9155c4ec57be2299
  if ((_headers$get = headers.get('accept')) !== null && _headers$get !== void 0 && _headers$get.includes('msw/passthrough')) return true;
  return false;
}
async function globalFetch(...args) {
  if (args[0] && args[0] instanceof Request) {
    const request = args[0];
    if (isMswRequestPassthrough(request.headers)) {
      const cookieHeaders = await Promise.all([...currentlyInterceptingInContexts.keys()].map(async context => {
        const cookies = await context.cookies(request.url);
        if (!cookies.length) return undefined;
        return cookies.map(c => `${c.name}=${c.value}`).join('; ');
      }));
      if (!cookieHeaders.length) throw new Error(`Cannot call fetch(bypass()) outside of a request handler`);
      if (cookieHeaders.some(h => h !== cookieHeaders[0])) throw new Error(`Cannot call fetch(bypass()) while concurrently handling multiple requests from different browser contexts`);
      const headers = new Headers(request.headers);
      headers.set('cookie', cookieHeaders[0]);
      {
        var _headers$get2;
        // pre 2.6.4
        headers.delete('x-msw-intention');
        // post 2.6.4
        const accept = (_headers$get2 = headers.get('accept')) === null || _headers$get2 === void 0 ? void 0 : _headers$get2.split(',').filter(h => !h.includes('msw/')).join(',');
        if (accept) headers.set('accept', accept);else headers.delete('accept');
      }
      args[0] = new Request(request.clone(), {
        headers
      });
    }
  }
  return originalFetch(...args);
}
class Router {
  constructor(context, baseURL) {
    this._context = void 0;
    this._requestHandlers = [];
    this._requestHandlersRoute = void 0;
    this._requestHandlersActive = false;
    this._routes = [];
    this._context = context;
    this._requestHandlersRoute = async route => {
      var _headersArray$find;
      if (route.request().isNavigationRequest()) {
        await route.fallback();
        return;
      }
      const request = route.request();
      const headersArray = await request.headersArray();
      const headers = new Headers();
      for (const {
        name,
        value
      } of headersArray) headers.append(name, value);
      const buffer = request.postDataBuffer();
      const body = buffer !== null && buffer !== void 0 && buffer.byteLength ? new Int8Array(buffer.buffer, buffer.byteOffset, buffer.length) : undefined;
      const newRequest = new Request(request.url(), {
        body: body,
        headers: headers,
        method: request.method(),
        referrer: (_headersArray$find = headersArray.find(h => h.name.toLowerCase() === 'referer')) === null || _headersArray$find === void 0 ? void 0 : _headersArray$find.value
      });
      currentlyInterceptingInContexts.set(context, 1 + (currentlyInterceptingInContexts.get(context) || 0));
      const response = await executeRequestHandlers(newRequest, this._requestHandlers, baseURL).finally(() => {
        const value = currentlyInterceptingInContexts.get(context) - 1;
        if (value) currentlyInterceptingInContexts.set(context, value);else currentlyInterceptingInContexts.delete(context);
      });
      if (!response) {
        await route.fallback();
        return;
      }
      if (response.status === 302 && response.headers.get('x-msw-intention') === 'passthrough') {
        await route.continue();
        return;
      }
      if (response.type === 'error') {
        await route.abort();
        return;
      }
      const responseHeaders = {};
      for (const [name, value] of response.headers.entries()) {
        if (responseHeaders[name]) responseHeaders[name] = responseHeaders[name] + (name.toLowerCase() === 'set-cookie' ? '\n' : ', ') + value;else responseHeaders[name] = value;
      }
      await route.fulfill({
        status: response.status,
        body: Buffer.from(await response.arrayBuffer()),
        headers: responseHeaders
      });
    };
  }
  async route(...routeArgs) {
    this._routes.push(routeArgs);
    return await this._context.route(...routeArgs);
  }
  async use(...handlers) {
    this._requestHandlers = handlers.concat(this._requestHandlers);
    await this._updateRequestHandlersRoute();
  }
  async dispose() {
    this._requestHandlers = [];
    await this._updateRequestHandlersRoute();
    for (const route of this._routes) await this._context.unroute(route[0], route[1]);
  }
  async _updateRequestHandlersRoute() {
    if (this._requestHandlers.length && !this._requestHandlersActive) {
      await this._context.route('**/*', this._requestHandlersRoute);
      if (!fetchOverrideCounter) globalThis.fetch = globalFetch;
      ++fetchOverrideCounter;
      this._requestHandlersActive = true;
    }
    if (!this._requestHandlers.length && this._requestHandlersActive) {
      await this._context.unroute('**/*', this._requestHandlersRoute);
      this._requestHandlersActive = false;
      --fetchOverrideCounter;
      if (!fetchOverrideCounter) globalThis.fetch = originalFetch;
    }
  }
}
exports.Router = Router;