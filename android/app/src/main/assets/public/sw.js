/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "7131cbfe2e93be0f9c5d3f804e04ab2e"
  }, {
    "url": "pwa-512x512.png",
    "revision": "a8d8b84e8ea143c690c29a57c57f1156"
  }, {
    "url": "pwa-192x192.png",
    "revision": "cded37a3e2e8edef0558314dbc55a119"
  }, {
    "url": "index.html",
    "revision": "681b8637ffe45e50a69f9c46d1c48d11"
  }, {
    "url": "icon.svg",
    "revision": "3eb350e499b5481460734ff74d140b92"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8efe31052ba2bae72bd6bc058f0d9e76"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-Dyo7_Aqz.js",
    "revision": null
  }, {
    "url": "assets/index-DqNZ77En.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8efe31052ba2bae72bd6bc058f0d9e76"
  }, {
    "url": "icon.svg",
    "revision": "3eb350e499b5481460734ff74d140b92"
  }, {
    "url": "pwa-192x192.png",
    "revision": "cded37a3e2e8edef0558314dbc55a119"
  }, {
    "url": "pwa-512x512.png",
    "revision": "a8d8b84e8ea143c690c29a57c57f1156"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "7131cbfe2e93be0f9c5d3f804e04ab2e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "807c402a839b51066674278239e4a590"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
