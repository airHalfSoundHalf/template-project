define(['exports', 'workbox-core/_private/logger.js', 'workbox-core/_private/WorkboxError.js', 'workbox-core/_private/assert.js', 'workbox-core/_private/getFriendlyURL.js', 'workbox-core/_private/cacheNames.js', 'workbox-core/_private/cacheMatchIgnoreParams.js', 'workbox-core/_private/Deferred.js', 'workbox-core/_private/executeQuotaErrorCallbacks.js', 'workbox-core/_private/timeout.js'], (function (exports, logger_js, WorkboxError_js, assert_js, getFriendlyURL_js, cacheNames_js, cacheMatchIgnoreParams_js, Deferred_js, executeQuotaErrorCallbacks_js, timeout_js) { 'use strict';

    // @ts-ignore
    try {
      self['workbox:routing:6.6.0'] && _();
    } catch (e) {}

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * The default HTTP method, 'GET', used when there's no specific method
     * configured for a route.
     *
     * @type {string}
     *
     * @private
     */
    const defaultMethod = 'GET';
    /**
     * The list of valid HTTP methods associated with requests that could be routed.
     *
     * @type {Array<string>}
     *
     * @private
     */
    const validMethods = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'];

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * @param {function()|Object} handler Either a function, or an object with a
     * 'handle' method.
     * @return {Object} An object with a handle method.
     *
     * @private
     */
    const normalizeHandler = handler => {
      if (handler && typeof handler === 'object') {
        {
          assert_js.assert.hasMethod(handler, 'handle', {
            moduleName: 'workbox-routing',
            className: 'Route',
            funcName: 'constructor',
            paramName: 'handler'
          });
        }
        return handler;
      } else {
        {
          assert_js.assert.isType(handler, 'function', {
            moduleName: 'workbox-routing',
            className: 'Route',
            funcName: 'constructor',
            paramName: 'handler'
          });
        }
        return {
          handle: handler
        };
      }
    };

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * A `Route` consists of a pair of callback functions, "match" and "handler".
     * The "match" callback determine if a route should be used to "handle" a
     * request by returning a non-falsy value if it can. The "handler" callback
     * is called when there is a match and should return a Promise that resolves
     * to a `Response`.
     *
     * @memberof workbox-routing
     */
    class Route {
      /**
       * Constructor for Route class.
       *
       * @param {workbox-routing~matchCallback} match
       * A callback function that determines whether the route matches a given
       * `fetch` event by returning a non-falsy value.
       * @param {workbox-routing~handlerCallback} handler A callback
       * function that returns a Promise resolving to a Response.
       * @param {string} [method='GET'] The HTTP method to match the Route
       * against.
       */
      constructor(match, handler, method = defaultMethod) {
        {
          assert_js.assert.isType(match, 'function', {
            moduleName: 'workbox-routing',
            className: 'Route',
            funcName: 'constructor',
            paramName: 'match'
          });
          if (method) {
            assert_js.assert.isOneOf(method, validMethods, {
              paramName: 'method'
            });
          }
        }
        // These values are referenced directly by Router so cannot be
        // altered by minificaton.
        this.handler = normalizeHandler(handler);
        this.match = match;
        this.method = method;
      }
      /**
       *
       * @param {workbox-routing-handlerCallback} handler A callback
       * function that returns a Promise resolving to a Response
       */
      setCatchHandler(handler) {
        this.catchHandler = normalizeHandler(handler);
      }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * RegExpRoute makes it easy to create a regular expression based
     * {@link workbox-routing.Route}.
     *
     * For same-origin requests the RegExp only needs to match part of the URL. For
     * requests against third-party servers, you must define a RegExp that matches
     * the start of the URL.
     *
     * @memberof workbox-routing
     * @extends workbox-routing.Route
     */
    class RegExpRoute extends Route {
      /**
       * If the regular expression contains
       * [capture groups]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references},
       * the captured values will be passed to the
       * {@link workbox-routing~handlerCallback} `params`
       * argument.
       *
       * @param {RegExp} regExp The regular expression to match against URLs.
       * @param {workbox-routing~handlerCallback} handler A callback
       * function that returns a Promise resulting in a Response.
       * @param {string} [method='GET'] The HTTP method to match the Route
       * against.
       */
      constructor(regExp, handler, method) {
        {
          assert_js.assert.isInstance(regExp, RegExp, {
            moduleName: 'workbox-routing',
            className: 'RegExpRoute',
            funcName: 'constructor',
            paramName: 'pattern'
          });
        }
        const match = ({
          url
        }) => {
          const result = regExp.exec(url.href);
          // Return immediately if there's no match.
          if (!result) {
            return;
          }
          // Require that the match start at the first character in the URL string
          // if it's a cross-origin request.
          // See https://github.com/GoogleChrome/workbox/issues/281 for the context
          // behind this behavior.
          if (url.origin !== location.origin && result.index !== 0) {
            {
              logger_js.logger.debug(`The regular expression '${regExp.toString()}' only partially matched ` + `against the cross-origin URL '${url.toString()}'. RegExpRoute's will only ` + `handle cross-origin requests if they match the entire URL.`);
            }
            return;
          }
          // If the route matches, but there aren't any capture groups defined, then
          // this will return [], which is truthy and therefore sufficient to
          // indicate a match.
          // If there are capture groups, then it will return their values.
          return result.slice(1);
        };
        super(match, handler, method);
      }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * The Router can be used to process a `FetchEvent` using one or more
     * {@link workbox-routing.Route}, responding with a `Response` if
     * a matching route exists.
     *
     * If no route matches a given a request, the Router will use a "default"
     * handler if one is defined.
     *
     * Should the matching Route throw an error, the Router will use a "catch"
     * handler if one is defined to gracefully deal with issues and respond with a
     * Request.
     *
     * If a request matches multiple routes, the **earliest** registered route will
     * be used to respond to the request.
     *
     * @memberof workbox-routing
     */
    class Router {
      /**
       * Initializes a new Router.
       */
      constructor() {
        this._routes = new Map();
        this._defaultHandlerMap = new Map();
      }
      /**
       * @return {Map<string, Array<workbox-routing.Route>>} routes A `Map` of HTTP
       * method name ('GET', etc.) to an array of all the corresponding `Route`
       * instances that are registered.
       */
      get routes() {
        return this._routes;
      }
      /**
       * Adds a fetch event listener to respond to events when a route matches
       * the event's request.
       */
      addFetchListener() {
        // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
        self.addEventListener('fetch', event => {
          const {
            request
          } = event;
          const responsePromise = this.handleRequest({
            request,
            event
          });
          if (responsePromise) {
            event.respondWith(responsePromise);
          }
        });
      }
      /**
       * Adds a message event listener for URLs to cache from the window.
       * This is useful to cache resources loaded on the page prior to when the
       * service worker started controlling it.
       *
       * The format of the message data sent from the window should be as follows.
       * Where the `urlsToCache` array may consist of URL strings or an array of
       * URL string + `requestInit` object (the same as you'd pass to `fetch()`).
       *
       * ```
       * {
       *   type: 'CACHE_URLS',
       *   payload: {
       *     urlsToCache: [
       *       './script1.js',
       *       './script2.js',
       *       ['./script3.js', {mode: 'no-cors'}],
       *     ],
       *   },
       * }
       * ```
       */
      addCacheListener() {
        // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
        self.addEventListener('message', event => {
          // event.data is type 'any'
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (event.data && event.data.type === 'CACHE_URLS') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const {
              payload
            } = event.data;
            {
              logger_js.logger.debug(`Caching URLs from the window`, payload.urlsToCache);
            }
            const requestPromises = Promise.all(payload.urlsToCache.map(entry => {
              if (typeof entry === 'string') {
                entry = [entry];
              }
              const request = new Request(...entry);
              return this.handleRequest({
                request,
                event
              });
              // TODO(philipwalton): TypeScript errors without this typecast for
              // some reason (probably a bug). The real type here should work but
              // doesn't: `Array<Promise<Response> | undefined>`.
            })); // TypeScript
            event.waitUntil(requestPromises);
            // If a MessageChannel was used, reply to the message on success.
            if (event.ports && event.ports[0]) {
              void requestPromises.then(() => event.ports[0].postMessage(true));
            }
          }
        });
      }
      /**
       * Apply the routing rules to a FetchEvent object to get a Response from an
       * appropriate Route's handler.
       *
       * @param {Object} options
       * @param {Request} options.request The request to handle.
       * @param {ExtendableEvent} options.event The event that triggered the
       *     request.
       * @return {Promise<Response>|undefined} A promise is returned if a
       *     registered route can handle the request. If there is no matching
       *     route and there's no `defaultHandler`, `undefined` is returned.
       */
      handleRequest({
        request,
        event
      }) {
        {
          assert_js.assert.isInstance(request, Request, {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'handleRequest',
            paramName: 'options.request'
          });
        }
        const url = new URL(request.url, location.href);
        if (!url.protocol.startsWith('http')) {
          {
            logger_js.logger.debug(`Workbox Router only supports URLs that start with 'http'.`);
          }
          return;
        }
        const sameOrigin = url.origin === location.origin;
        const {
          params,
          route
        } = this.findMatchingRoute({
          event,
          request,
          sameOrigin,
          url
        });
        let handler = route && route.handler;
        const debugMessages = [];
        {
          if (handler) {
            debugMessages.push([`Found a route to handle this request:`, route]);
            if (params) {
              debugMessages.push([`Passing the following params to the route's handler:`, params]);
            }
          }
        }
        // If we don't have a handler because there was no matching route, then
        // fall back to defaultHandler if that's defined.
        const method = request.method;
        if (!handler && this._defaultHandlerMap.has(method)) {
          {
            debugMessages.push(`Failed to find a matching route. Falling ` + `back to the default handler for ${method}.`);
          }
          handler = this._defaultHandlerMap.get(method);
        }
        if (!handler) {
          {
            // No handler so Workbox will do nothing. If logs is set of debug
            // i.e. verbose, we should print out this information.
            logger_js.logger.debug(`No route found for: ${getFriendlyURL_js.getFriendlyURL(url)}`);
          }
          return;
        }
        {
          // We have a handler, meaning Workbox is going to handle the route.
          // print the routing details to the console.
          logger_js.logger.groupCollapsed(`Router is responding to: ${getFriendlyURL_js.getFriendlyURL(url)}`);
          debugMessages.forEach(msg => {
            if (Array.isArray(msg)) {
              logger_js.logger.log(...msg);
            } else {
              logger_js.logger.log(msg);
            }
          });
          logger_js.logger.groupEnd();
        }
        // Wrap in try and catch in case the handle method throws a synchronous
        // error. It should still callback to the catch handler.
        let responsePromise;
        try {
          responsePromise = handler.handle({
            url,
            request,
            event,
            params
          });
        } catch (err) {
          responsePromise = Promise.reject(err);
        }
        // Get route's catch handler, if it exists
        const catchHandler = route && route.catchHandler;
        if (responsePromise instanceof Promise && (this._catchHandler || catchHandler)) {
          responsePromise = responsePromise.catch(async err => {
            // If there's a route catch handler, process that first
            if (catchHandler) {
              {
                // Still include URL here as it will be async from the console group
                // and may not make sense without the URL
                logger_js.logger.groupCollapsed(`Error thrown when responding to: ` + ` ${getFriendlyURL_js.getFriendlyURL(url)}. Falling back to route's Catch Handler.`);
                logger_js.logger.error(`Error thrown by:`, route);
                logger_js.logger.error(err);
                logger_js.logger.groupEnd();
              }
              try {
                return await catchHandler.handle({
                  url,
                  request,
                  event,
                  params
                });
              } catch (catchErr) {
                if (catchErr instanceof Error) {
                  err = catchErr;
                }
              }
            }
            if (this._catchHandler) {
              {
                // Still include URL here as it will be async from the console group
                // and may not make sense without the URL
                logger_js.logger.groupCollapsed(`Error thrown when responding to: ` + ` ${getFriendlyURL_js.getFriendlyURL(url)}. Falling back to global Catch Handler.`);
                logger_js.logger.error(`Error thrown by:`, route);
                logger_js.logger.error(err);
                logger_js.logger.groupEnd();
              }
              return this._catchHandler.handle({
                url,
                request,
                event
              });
            }
            throw err;
          });
        }
        return responsePromise;
      }
      /**
       * Checks a request and URL (and optionally an event) against the list of
       * registered routes, and if there's a match, returns the corresponding
       * route along with any params generated by the match.
       *
       * @param {Object} options
       * @param {URL} options.url
       * @param {boolean} options.sameOrigin The result of comparing `url.origin`
       *     against the current origin.
       * @param {Request} options.request The request to match.
       * @param {Event} options.event The corresponding event.
       * @return {Object} An object with `route` and `params` properties.
       *     They are populated if a matching route was found or `undefined`
       *     otherwise.
       */
      findMatchingRoute({
        url,
        sameOrigin,
        request,
        event
      }) {
        const routes = this._routes.get(request.method) || [];
        for (const route of routes) {
          let params;
          // route.match returns type any, not possible to change right now.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const matchResult = route.match({
            url,
            sameOrigin,
            request,
            event
          });
          if (matchResult) {
            {
              // Warn developers that using an async matchCallback is almost always
              // not the right thing to do.
              if (matchResult instanceof Promise) {
                logger_js.logger.warn(`While routing ${getFriendlyURL_js.getFriendlyURL(url)}, an async ` + `matchCallback function was used. Please convert the ` + `following route to use a synchronous matchCallback function:`, route);
              }
            }
            // See https://github.com/GoogleChrome/workbox/issues/2079
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            params = matchResult;
            if (Array.isArray(params) && params.length === 0) {
              // Instead of passing an empty array in as params, use undefined.
              params = undefined;
            } else if (matchResult.constructor === Object &&
            // eslint-disable-line
            Object.keys(matchResult).length === 0) {
              // Instead of passing an empty object in as params, use undefined.
              params = undefined;
            } else if (typeof matchResult === 'boolean') {
              // For the boolean value true (rather than just something truth-y),
              // don't set params.
              // See https://github.com/GoogleChrome/workbox/pull/2134#issuecomment-513924353
              params = undefined;
            }
            // Return early if have a match.
            return {
              route,
              params
            };
          }
        }
        // If no match was found above, return and empty object.
        return {};
      }
      /**
       * Define a default `handler` that's called when no routes explicitly
       * match the incoming request.
       *
       * Each HTTP method ('GET', 'POST', etc.) gets its own default handler.
       *
       * Without a default handler, unmatched requests will go against the
       * network as if there were no service worker present.
       *
       * @param {workbox-routing~handlerCallback} handler A callback
       * function that returns a Promise resulting in a Response.
       * @param {string} [method='GET'] The HTTP method to associate with this
       * default handler. Each method has its own default.
       */
      setDefaultHandler(handler, method = defaultMethod) {
        this._defaultHandlerMap.set(method, normalizeHandler(handler));
      }
      /**
       * If a Route throws an error while handling a request, this `handler`
       * will be called and given a chance to provide a response.
       *
       * @param {workbox-routing~handlerCallback} handler A callback
       * function that returns a Promise resulting in a Response.
       */
      setCatchHandler(handler) {
        this._catchHandler = normalizeHandler(handler);
      }
      /**
       * Registers a route with the router.
       *
       * @param {workbox-routing.Route} route The route to register.
       */
      registerRoute(route) {
        {
          assert_js.assert.isType(route, 'object', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route'
          });
          assert_js.assert.hasMethod(route, 'match', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route'
          });
          assert_js.assert.isType(route.handler, 'object', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route'
          });
          assert_js.assert.hasMethod(route.handler, 'handle', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route.handler'
          });
          assert_js.assert.isType(route.method, 'string', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route.method'
          });
        }
        if (!this._routes.has(route.method)) {
          this._routes.set(route.method, []);
        }
        // Give precedence to all of the earlier routes by adding this additional
        // route to the end of the array.
        this._routes.get(route.method).push(route);
      }
      /**
       * Unregisters a route with the router.
       *
       * @param {workbox-routing.Route} route The route to unregister.
       */
      unregisterRoute(route) {
        if (!this._routes.has(route.method)) {
          throw new WorkboxError_js.WorkboxError('unregister-route-but-not-found-with-method', {
            method: route.method
          });
        }
        const routeIndex = this._routes.get(route.method).indexOf(route);
        if (routeIndex > -1) {
          this._routes.get(route.method).splice(routeIndex, 1);
        } else {
          throw new WorkboxError_js.WorkboxError('unregister-route-route-not-registered');
        }
      }
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    let defaultRouter;
    /**
     * Creates a new, singleton Router instance if one does not exist. If one
     * does already exist, that instance is returned.
     *
     * @private
     * @return {Router}
     */
    const getOrCreateDefaultRouter = () => {
      if (!defaultRouter) {
        defaultRouter = new Router();
        // The helpers that use the default Router assume these listeners exist.
        defaultRouter.addFetchListener();
        defaultRouter.addCacheListener();
      }
      return defaultRouter;
    };

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Easily register a RegExp, string, or function with a caching
     * strategy to a singleton Router instance.
     *
     * This method will generate a Route for you if needed and
     * call {@link workbox-routing.Router#registerRoute}.
     *
     * @param {RegExp|string|workbox-routing.Route~matchCallback|workbox-routing.Route} capture
     * If the capture param is a `Route`, all other arguments will be ignored.
     * @param {workbox-routing~handlerCallback} [handler] A callback
     * function that returns a Promise resulting in a Response. This parameter
     * is required if `capture` is not a `Route` object.
     * @param {string} [method='GET'] The HTTP method to match the Route
     * against.
     * @return {workbox-routing.Route} The generated `Route`.
     *
     * @memberof workbox-routing
     */
    function registerRoute(capture, handler, method) {
      let route;
      if (typeof capture === 'string') {
        const captureUrl = new URL(capture, location.href);
        {
          if (!(capture.startsWith('/') || capture.startsWith('http'))) {
            throw new WorkboxError_js.WorkboxError('invalid-string', {
              moduleName: 'workbox-routing',
              funcName: 'registerRoute',
              paramName: 'capture'
            });
          }
          // We want to check if Express-style wildcards are in the pathname only.
          // TODO: Remove this log message in v4.
          const valueToCheck = capture.startsWith('http') ? captureUrl.pathname : capture;
          // See https://github.com/pillarjs/path-to-regexp#parameters
          const wildcards = '[*:?+]';
          if (new RegExp(`${wildcards}`).exec(valueToCheck)) {
            logger_js.logger.debug(`The '$capture' parameter contains an Express-style wildcard ` + `character (${wildcards}). Strings are now always interpreted as ` + `exact matches; use a RegExp for partial or wildcard matches.`);
          }
        }
        const matchCallback = ({
          url
        }) => {
          {
            if (url.pathname === captureUrl.pathname && url.origin !== captureUrl.origin) {
              logger_js.logger.debug(`${capture} only partially matches the cross-origin URL ` + `${url.toString()}. This route will only handle cross-origin requests ` + `if they match the entire URL.`);
            }
          }
          return url.href === captureUrl.href;
        };
        // If `capture` is a string then `handler` and `method` must be present.
        route = new Route(matchCallback, handler, method);
      } else if (capture instanceof RegExp) {
        // If `capture` is a `RegExp` then `handler` and `method` must be present.
        route = new RegExpRoute(capture, handler, method);
      } else if (typeof capture === 'function') {
        // If `capture` is a function then `handler` and `method` must be present.
        route = new Route(capture, handler, method);
      } else if (capture instanceof Route) {
        route = capture;
      } else {
        throw new WorkboxError_js.WorkboxError('unsupported-route-type', {
          moduleName: 'workbox-routing',
          funcName: 'registerRoute',
          paramName: 'capture'
        });
      }
      const defaultRouter = getOrCreateDefaultRouter();
      defaultRouter.registerRoute(route);
      return route;
    }

    // @ts-ignore
    try {
      self['workbox:strategies:6.6.0'] && _();
    } catch (e) {}

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const cacheOkAndOpaquePlugin = {
      /**
       * Returns a valid response (to allow caching) if the status is 200 (OK) or
       * 0 (opaque).
       *
       * @param {Object} options
       * @param {Response} options.response
       * @return {Response|null}
       *
       * @private
       */
      cacheWillUpdate: async ({
        response
      }) => {
        if (response.status === 200 || response.status === 0) {
          return response;
        }
        return null;
      }
    };

    /*
      Copyright 2020 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    function toRequest(input) {
      return typeof input === 'string' ? new Request(input) : input;
    }
    /**
     * A class created every time a Strategy instance instance calls
     * {@link workbox-strategies.Strategy~handle} or
     * {@link workbox-strategies.Strategy~handleAll} that wraps all fetch and
     * cache actions around plugin callbacks and keeps track of when the strategy
     * is "done" (i.e. all added `event.waitUntil()` promises have resolved).
     *
     * @memberof workbox-strategies
     */
    class StrategyHandler {
      /**
       * Creates a new instance associated with the passed strategy and event
       * that's handling the request.
       *
       * The constructor also initializes the state that will be passed to each of
       * the plugins handling this request.
       *
       * @param {workbox-strategies.Strategy} strategy
       * @param {Object} options
       * @param {Request|string} options.request A request to run this strategy for.
       * @param {ExtendableEvent} options.event The event associated with the
       *     request.
       * @param {URL} [options.url]
       * @param {*} [options.params] The return value from the
       *     {@link workbox-routing~matchCallback} (if applicable).
       */
      constructor(strategy, options) {
        this._cacheKeys = {};
        /**
         * The request the strategy is performing (passed to the strategy's
         * `handle()` or `handleAll()` method).
         * @name request
         * @instance
         * @type {Request}
         * @memberof workbox-strategies.StrategyHandler
         */
        /**
         * The event associated with this request.
         * @name event
         * @instance
         * @type {ExtendableEvent}
         * @memberof workbox-strategies.StrategyHandler
         */
        /**
         * A `URL` instance of `request.url` (if passed to the strategy's
         * `handle()` or `handleAll()` method).
         * Note: the `url` param will be present if the strategy was invoked
         * from a workbox `Route` object.
         * @name url
         * @instance
         * @type {URL|undefined}
         * @memberof workbox-strategies.StrategyHandler
         */
        /**
         * A `param` value (if passed to the strategy's
         * `handle()` or `handleAll()` method).
         * Note: the `param` param will be present if the strategy was invoked
         * from a workbox `Route` object and the
         * {@link workbox-routing~matchCallback} returned
         * a truthy value (it will be that value).
         * @name params
         * @instance
         * @type {*|undefined}
         * @memberof workbox-strategies.StrategyHandler
         */
        {
          assert_js.assert.isInstance(options.event, ExtendableEvent, {
            moduleName: 'workbox-strategies',
            className: 'StrategyHandler',
            funcName: 'constructor',
            paramName: 'options.event'
          });
        }
        Object.assign(this, options);
        this.event = options.event;
        this._strategy = strategy;
        this._handlerDeferred = new Deferred_js.Deferred();
        this._extendLifetimePromises = [];
        // Copy the plugins list (since it's mutable on the strategy),
        // so any mutations don't affect this handler instance.
        this._plugins = [...strategy.plugins];
        this._pluginStateMap = new Map();
        for (const plugin of this._plugins) {
          this._pluginStateMap.set(plugin, {});
        }
        this.event.waitUntil(this._handlerDeferred.promise);
      }
      /**
       * Fetches a given request (and invokes any applicable plugin callback
       * methods) using the `fetchOptions` (for non-navigation requests) and
       * `plugins` defined on the `Strategy` object.
       *
       * The following plugin lifecycle methods are invoked when using this method:
       * - `requestWillFetch()`
       * - `fetchDidSucceed()`
       * - `fetchDidFail()`
       *
       * @param {Request|string} input The URL or request to fetch.
       * @return {Promise<Response>}
       */
      async fetch(input) {
        const {
          event
        } = this;
        let request = toRequest(input);
        if (request.mode === 'navigate' && event instanceof FetchEvent && event.preloadResponse) {
          const possiblePreloadResponse = await event.preloadResponse;
          if (possiblePreloadResponse) {
            {
              logger_js.logger.log(`Using a preloaded navigation response for ` + `'${getFriendlyURL_js.getFriendlyURL(request.url)}'`);
            }
            return possiblePreloadResponse;
          }
        }
        // If there is a fetchDidFail plugin, we need to save a clone of the
        // original request before it's either modified by a requestWillFetch
        // plugin or before the original request's body is consumed via fetch().
        const originalRequest = this.hasCallback('fetchDidFail') ? request.clone() : null;
        try {
          for (const cb of this.iterateCallbacks('requestWillFetch')) {
            request = await cb({
              request: request.clone(),
              event
            });
          }
        } catch (err) {
          if (err instanceof Error) {
            throw new WorkboxError_js.WorkboxError('plugin-error-request-will-fetch', {
              thrownErrorMessage: err.message
            });
          }
        }
        // The request can be altered by plugins with `requestWillFetch` making
        // the original request (most likely from a `fetch` event) different
        // from the Request we make. Pass both to `fetchDidFail` to aid debugging.
        const pluginFilteredRequest = request.clone();
        try {
          let fetchResponse;
          // See https://github.com/GoogleChrome/workbox/issues/1796
          fetchResponse = await fetch(request, request.mode === 'navigate' ? undefined : this._strategy.fetchOptions);
          if ("development" !== 'production') {
            logger_js.logger.debug(`Network request for ` + `'${getFriendlyURL_js.getFriendlyURL(request.url)}' returned a response with ` + `status '${fetchResponse.status}'.`);
          }
          for (const callback of this.iterateCallbacks('fetchDidSucceed')) {
            fetchResponse = await callback({
              event,
              request: pluginFilteredRequest,
              response: fetchResponse
            });
          }
          return fetchResponse;
        } catch (error) {
          {
            logger_js.logger.log(`Network request for ` + `'${getFriendlyURL_js.getFriendlyURL(request.url)}' threw an error.`, error);
          }
          // `originalRequest` will only exist if a `fetchDidFail` callback
          // is being used (see above).
          if (originalRequest) {
            await this.runCallbacks('fetchDidFail', {
              error: error,
              event,
              originalRequest: originalRequest.clone(),
              request: pluginFilteredRequest.clone()
            });
          }
          throw error;
        }
      }
      /**
       * Calls `this.fetch()` and (in the background) runs `this.cachePut()` on
       * the response generated by `this.fetch()`.
       *
       * The call to `this.cachePut()` automatically invokes `this.waitUntil()`,
       * so you do not have to manually call `waitUntil()` on the event.
       *
       * @param {Request|string} input The request or URL to fetch and cache.
       * @return {Promise<Response>}
       */
      async fetchAndCachePut(input) {
        const response = await this.fetch(input);
        const responseClone = response.clone();
        void this.waitUntil(this.cachePut(input, responseClone));
        return response;
      }
      /**
       * Matches a request from the cache (and invokes any applicable plugin
       * callback methods) using the `cacheName`, `matchOptions`, and `plugins`
       * defined on the strategy object.
       *
       * The following plugin lifecycle methods are invoked when using this method:
       * - cacheKeyWillByUsed()
       * - cachedResponseWillByUsed()
       *
       * @param {Request|string} key The Request or URL to use as the cache key.
       * @return {Promise<Response|undefined>} A matching response, if found.
       */
      async cacheMatch(key) {
        const request = toRequest(key);
        let cachedResponse;
        const {
          cacheName,
          matchOptions
        } = this._strategy;
        const effectiveRequest = await this.getCacheKey(request, 'read');
        const multiMatchOptions = Object.assign(Object.assign({}, matchOptions), {
          cacheName
        });
        cachedResponse = await caches.match(effectiveRequest, multiMatchOptions);
        {
          if (cachedResponse) {
            logger_js.logger.debug(`Found a cached response in '${cacheName}'.`);
          } else {
            logger_js.logger.debug(`No cached response found in '${cacheName}'.`);
          }
        }
        for (const callback of this.iterateCallbacks('cachedResponseWillBeUsed')) {
          cachedResponse = (await callback({
            cacheName,
            matchOptions,
            cachedResponse,
            request: effectiveRequest,
            event: this.event
          })) || undefined;
        }
        return cachedResponse;
      }
      /**
       * Puts a request/response pair in the cache (and invokes any applicable
       * plugin callback methods) using the `cacheName` and `plugins` defined on
       * the strategy object.
       *
       * The following plugin lifecycle methods are invoked when using this method:
       * - cacheKeyWillByUsed()
       * - cacheWillUpdate()
       * - cacheDidUpdate()
       *
       * @param {Request|string} key The request or URL to use as the cache key.
       * @param {Response} response The response to cache.
       * @return {Promise<boolean>} `false` if a cacheWillUpdate caused the response
       * not be cached, and `true` otherwise.
       */
      async cachePut(key, response) {
        const request = toRequest(key);
        // Run in the next task to avoid blocking other cache reads.
        // https://github.com/w3c/ServiceWorker/issues/1397
        await timeout_js.timeout(0);
        const effectiveRequest = await this.getCacheKey(request, 'write');
        {
          if (effectiveRequest.method && effectiveRequest.method !== 'GET') {
            throw new WorkboxError_js.WorkboxError('attempt-to-cache-non-get-request', {
              url: getFriendlyURL_js.getFriendlyURL(effectiveRequest.url),
              method: effectiveRequest.method
            });
          }
          // See https://github.com/GoogleChrome/workbox/issues/2818
          const vary = response.headers.get('Vary');
          if (vary) {
            logger_js.logger.debug(`The response for ${getFriendlyURL_js.getFriendlyURL(effectiveRequest.url)} ` + `has a 'Vary: ${vary}' header. ` + `Consider setting the {ignoreVary: true} option on your strategy ` + `to ensure cache matching and deletion works as expected.`);
          }
        }
        if (!response) {
          {
            logger_js.logger.error(`Cannot cache non-existent response for ` + `'${getFriendlyURL_js.getFriendlyURL(effectiveRequest.url)}'.`);
          }
          throw new WorkboxError_js.WorkboxError('cache-put-with-no-response', {
            url: getFriendlyURL_js.getFriendlyURL(effectiveRequest.url)
          });
        }
        const responseToCache = await this._ensureResponseSafeToCache(response);
        if (!responseToCache) {
          {
            logger_js.logger.debug(`Response '${getFriendlyURL_js.getFriendlyURL(effectiveRequest.url)}' ` + `will not be cached.`, responseToCache);
          }
          return false;
        }
        const {
          cacheName,
          matchOptions
        } = this._strategy;
        const cache = await self.caches.open(cacheName);
        const hasCacheUpdateCallback = this.hasCallback('cacheDidUpdate');
        const oldResponse = hasCacheUpdateCallback ? await cacheMatchIgnoreParams_js.cacheMatchIgnoreParams(
        // TODO(philipwalton): the `__WB_REVISION__` param is a precaching
        // feature. Consider into ways to only add this behavior if using
        // precaching.
        cache, effectiveRequest.clone(), ['__WB_REVISION__'], matchOptions) : null;
        {
          logger_js.logger.debug(`Updating the '${cacheName}' cache with a new Response ` + `for ${getFriendlyURL_js.getFriendlyURL(effectiveRequest.url)}.`);
        }
        try {
          await cache.put(effectiveRequest, hasCacheUpdateCallback ? responseToCache.clone() : responseToCache);
        } catch (error) {
          if (error instanceof Error) {
            // See https://developer.mozilla.org/en-US/docs/Web/API/DOMException#exception-QuotaExceededError
            if (error.name === 'QuotaExceededError') {
              await executeQuotaErrorCallbacks_js.executeQuotaErrorCallbacks();
            }
            throw error;
          }
        }
        for (const callback of this.iterateCallbacks('cacheDidUpdate')) {
          await callback({
            cacheName,
            oldResponse,
            newResponse: responseToCache.clone(),
            request: effectiveRequest,
            event: this.event
          });
        }
        return true;
      }
      /**
       * Checks the list of plugins for the `cacheKeyWillBeUsed` callback, and
       * executes any of those callbacks found in sequence. The final `Request`
       * object returned by the last plugin is treated as the cache key for cache
       * reads and/or writes. If no `cacheKeyWillBeUsed` plugin callbacks have
       * been registered, the passed request is returned unmodified
       *
       * @param {Request} request
       * @param {string} mode
       * @return {Promise<Request>}
       */
      async getCacheKey(request, mode) {
        const key = `${request.url} | ${mode}`;
        if (!this._cacheKeys[key]) {
          let effectiveRequest = request;
          for (const callback of this.iterateCallbacks('cacheKeyWillBeUsed')) {
            effectiveRequest = toRequest(await callback({
              mode,
              request: effectiveRequest,
              event: this.event,
              // params has a type any can't change right now.
              params: this.params // eslint-disable-line
            }));
          }

          this._cacheKeys[key] = effectiveRequest;
        }
        return this._cacheKeys[key];
      }
      /**
       * Returns true if the strategy has at least one plugin with the given
       * callback.
       *
       * @param {string} name The name of the callback to check for.
       * @return {boolean}
       */
      hasCallback(name) {
        for (const plugin of this._strategy.plugins) {
          if (name in plugin) {
            return true;
          }
        }
        return false;
      }
      /**
       * Runs all plugin callbacks matching the given name, in order, passing the
       * given param object (merged ith the current plugin state) as the only
       * argument.
       *
       * Note: since this method runs all plugins, it's not suitable for cases
       * where the return value of a callback needs to be applied prior to calling
       * the next callback. See
       * {@link workbox-strategies.StrategyHandler#iterateCallbacks}
       * below for how to handle that case.
       *
       * @param {string} name The name of the callback to run within each plugin.
       * @param {Object} param The object to pass as the first (and only) param
       *     when executing each callback. This object will be merged with the
       *     current plugin state prior to callback execution.
       */
      async runCallbacks(name, param) {
        for (const callback of this.iterateCallbacks(name)) {
          // TODO(philipwalton): not sure why `any` is needed. It seems like
          // this should work with `as WorkboxPluginCallbackParam[C]`.
          await callback(param);
        }
      }
      /**
       * Accepts a callback and returns an iterable of matching plugin callbacks,
       * where each callback is wrapped with the current handler state (i.e. when
       * you call each callback, whatever object parameter you pass it will
       * be merged with the plugin's current state).
       *
       * @param {string} name The name fo the callback to run
       * @return {Array<Function>}
       */
      *iterateCallbacks(name) {
        for (const plugin of this._strategy.plugins) {
          if (typeof plugin[name] === 'function') {
            const state = this._pluginStateMap.get(plugin);
            const statefulCallback = param => {
              const statefulParam = Object.assign(Object.assign({}, param), {
                state
              });
              // TODO(philipwalton): not sure why `any` is needed. It seems like
              // this should work with `as WorkboxPluginCallbackParam[C]`.
              return plugin[name](statefulParam);
            };
            yield statefulCallback;
          }
        }
      }
      /**
       * Adds a promise to the
       * [extend lifetime promises]{@link https://w3c.github.io/ServiceWorker/#extendableevent-extend-lifetime-promises}
       * of the event event associated with the request being handled (usually a
       * `FetchEvent`).
       *
       * Note: you can await
       * {@link workbox-strategies.StrategyHandler~doneWaiting}
       * to know when all added promises have settled.
       *
       * @param {Promise} promise A promise to add to the extend lifetime promises
       *     of the event that triggered the request.
       */
      waitUntil(promise) {
        this._extendLifetimePromises.push(promise);
        return promise;
      }
      /**
       * Returns a promise that resolves once all promises passed to
       * {@link workbox-strategies.StrategyHandler~waitUntil}
       * have settled.
       *
       * Note: any work done after `doneWaiting()` settles should be manually
       * passed to an event's `waitUntil()` method (not this handler's
       * `waitUntil()` method), otherwise the service worker thread my be killed
       * prior to your work completing.
       */
      async doneWaiting() {
        let promise;
        while (promise = this._extendLifetimePromises.shift()) {
          await promise;
        }
      }
      /**
       * Stops running the strategy and immediately resolves any pending
       * `waitUntil()` promises.
       */
      destroy() {
        this._handlerDeferred.resolve(null);
      }
      /**
       * This method will call cacheWillUpdate on the available plugins (or use
       * status === 200) to determine if the Response is safe and valid to cache.
       *
       * @param {Request} options.request
       * @param {Response} options.response
       * @return {Promise<Response|undefined>}
       *
       * @private
       */
      async _ensureResponseSafeToCache(response) {
        let responseToCache = response;
        let pluginsUsed = false;
        for (const callback of this.iterateCallbacks('cacheWillUpdate')) {
          responseToCache = (await callback({
            request: this.request,
            response: responseToCache,
            event: this.event
          })) || undefined;
          pluginsUsed = true;
          if (!responseToCache) {
            break;
          }
        }
        if (!pluginsUsed) {
          if (responseToCache && responseToCache.status !== 200) {
            responseToCache = undefined;
          }
          {
            if (responseToCache) {
              if (responseToCache.status !== 200) {
                if (responseToCache.status === 0) {
                  logger_js.logger.warn(`The response for '${this.request.url}' ` + `is an opaque response. The caching strategy that you're ` + `using will not cache opaque responses by default.`);
                } else {
                  logger_js.logger.debug(`The response for '${this.request.url}' ` + `returned a status code of '${response.status}' and won't ` + `be cached as a result.`);
                }
              }
            }
          }
        }
        return responseToCache;
      }
    }

    /*
      Copyright 2020 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * An abstract base class that all other strategy classes must extend from:
     *
     * @memberof workbox-strategies
     */
    class Strategy {
      /**
       * Creates a new instance of the strategy and sets all documented option
       * properties as public instance properties.
       *
       * Note: if a custom strategy class extends the base Strategy class and does
       * not need more than these properties, it does not need to define its own
       * constructor.
       *
       * @param {Object} [options]
       * @param {string} [options.cacheName] Cache name to store and retrieve
       * requests. Defaults to the cache names provided by
       * {@link workbox-core.cacheNames}.
       * @param {Array<Object>} [options.plugins] [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
       * to use in conjunction with this caching strategy.
       * @param {Object} [options.fetchOptions] Values passed along to the
       * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
       * of [non-navigation](https://github.com/GoogleChrome/workbox/issues/1796)
       * `fetch()` requests made by this strategy.
       * @param {Object} [options.matchOptions] The
       * [`CacheQueryOptions`]{@link https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions}
       * for any `cache.match()` or `cache.put()` calls made by this strategy.
       */
      constructor(options = {}) {
        /**
         * Cache name to store and retrieve
         * requests. Defaults to the cache names provided by
         * {@link workbox-core.cacheNames}.
         *
         * @type {string}
         */
        this.cacheName = cacheNames_js.cacheNames.getRuntimeName(options.cacheName);
        /**
         * The list
         * [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
         * used by this strategy.
         *
         * @type {Array<Object>}
         */
        this.plugins = options.plugins || [];
        /**
         * Values passed along to the
         * [`init`]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters}
         * of all fetch() requests made by this strategy.
         *
         * @type {Object}
         */
        this.fetchOptions = options.fetchOptions;
        /**
         * The
         * [`CacheQueryOptions`]{@link https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions}
         * for any `cache.match()` or `cache.put()` calls made by this strategy.
         *
         * @type {Object}
         */
        this.matchOptions = options.matchOptions;
      }
      /**
       * Perform a request strategy and returns a `Promise` that will resolve with
       * a `Response`, invoking all relevant plugin callbacks.
       *
       * When a strategy instance is registered with a Workbox
       * {@link workbox-routing.Route}, this method is automatically
       * called when the route matches.
       *
       * Alternatively, this method can be used in a standalone `FetchEvent`
       * listener by passing it to `event.respondWith()`.
       *
       * @param {FetchEvent|Object} options A `FetchEvent` or an object with the
       *     properties listed below.
       * @param {Request|string} options.request A request to run this strategy for.
       * @param {ExtendableEvent} options.event The event associated with the
       *     request.
       * @param {URL} [options.url]
       * @param {*} [options.params]
       */
      handle(options) {
        const [responseDone] = this.handleAll(options);
        return responseDone;
      }
      /**
       * Similar to {@link workbox-strategies.Strategy~handle}, but
       * instead of just returning a `Promise` that resolves to a `Response` it
       * it will return an tuple of `[response, done]` promises, where the former
       * (`response`) is equivalent to what `handle()` returns, and the latter is a
       * Promise that will resolve once any promises that were added to
       * `event.waitUntil()` as part of performing the strategy have completed.
       *
       * You can await the `done` promise to ensure any extra work performed by
       * the strategy (usually caching responses) completes successfully.
       *
       * @param {FetchEvent|Object} options A `FetchEvent` or an object with the
       *     properties listed below.
       * @param {Request|string} options.request A request to run this strategy for.
       * @param {ExtendableEvent} options.event The event associated with the
       *     request.
       * @param {URL} [options.url]
       * @param {*} [options.params]
       * @return {Array<Promise>} A tuple of [response, done]
       *     promises that can be used to determine when the response resolves as
       *     well as when the handler has completed all its work.
       */
      handleAll(options) {
        // Allow for flexible options to be passed.
        if (options instanceof FetchEvent) {
          options = {
            event: options,
            request: options.request
          };
        }
        const event = options.event;
        const request = typeof options.request === 'string' ? new Request(options.request) : options.request;
        const params = 'params' in options ? options.params : undefined;
        const handler = new StrategyHandler(this, {
          event,
          request,
          params
        });
        const responseDone = this._getResponse(handler, request, event);
        const handlerDone = this._awaitComplete(responseDone, handler, request, event);
        // Return an array of promises, suitable for use with Promise.all().
        return [responseDone, handlerDone];
      }
      async _getResponse(handler, request, event) {
        await handler.runCallbacks('handlerWillStart', {
          event,
          request
        });
        let response = undefined;
        try {
          response = await this._handle(request, handler);
          // The "official" Strategy subclasses all throw this error automatically,
          // but in case a third-party Strategy doesn't, ensure that we have a
          // consistent failure when there's no response or an error response.
          if (!response || response.type === 'error') {
            throw new WorkboxError_js.WorkboxError('no-response', {
              url: request.url
            });
          }
        } catch (error) {
          if (error instanceof Error) {
            for (const callback of handler.iterateCallbacks('handlerDidError')) {
              response = await callback({
                error,
                event,
                request
              });
              if (response) {
                break;
              }
            }
          }
          if (!response) {
            throw error;
          } else {
            logger_js.logger.log(`While responding to '${getFriendlyURL_js.getFriendlyURL(request.url)}', ` + `an ${error instanceof Error ? error.toString() : ''} error occurred. Using a fallback response provided by ` + `a handlerDidError plugin.`);
          }
        }
        for (const callback of handler.iterateCallbacks('handlerWillRespond')) {
          response = await callback({
            event,
            request,
            response
          });
        }
        return response;
      }
      async _awaitComplete(responseDone, handler, request, event) {
        let response;
        let error;
        try {
          response = await responseDone;
        } catch (error) {
          // Ignore errors, as response errors should be caught via the `response`
          // promise above. The `done` promise will only throw for errors in
          // promises passed to `handler.waitUntil()`.
        }
        try {
          await handler.runCallbacks('handlerDidRespond', {
            event,
            request,
            response
          });
          await handler.doneWaiting();
        } catch (waitUntilError) {
          if (waitUntilError instanceof Error) {
            error = waitUntilError;
          }
        }
        await handler.runCallbacks('handlerDidComplete', {
          event,
          request,
          response,
          error: error
        });
        handler.destroy();
        if (error) {
          throw error;
        }
      }
    }
    /**
     * Classes extending the `Strategy` based class should implement this method,
     * and leverage the {@link workbox-strategies.StrategyHandler}
     * arg to perform all fetching and cache logic, which will ensure all relevant
     * cache, cache options, fetch options and plugins are used (per the current
     * strategy instance).
     *
     * @name _handle
     * @instance
     * @abstract
     * @function
     * @param {Request} request
     * @param {workbox-strategies.StrategyHandler} handler
     * @return {Promise<Response>}
     *
     * @memberof workbox-strategies.Strategy
     */

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const messages = {
      strategyStart: (strategyName, request) => `Using ${strategyName} to respond to '${getFriendlyURL_js.getFriendlyURL(request.url)}'`,
      printFinalResponse: response => {
        if (response) {
          logger_js.logger.groupCollapsed(`View the final response here.`);
          logger_js.logger.log(response || '[No response returned]');
          logger_js.logger.groupEnd();
        }
      }
    };

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * An implementation of a
     * [network first](https://developer.chrome.com/docs/workbox/caching-strategies-overview/#network-first-falling-back-to-cache)
     * request strategy.
     *
     * By default, this strategy will cache responses with a 200 status code as
     * well as [opaque responses](https://developer.chrome.com/docs/workbox/caching-resources-during-runtime/#opaque-responses).
     * Opaque responses are are cross-origin requests where the response doesn't
     * support [CORS](https://enable-cors.org/).
     *
     * If the network request fails, and there is no cache match, this will throw
     * a `WorkboxError` exception.
     *
     * @extends workbox-strategies.Strategy
     * @memberof workbox-strategies
     */
    class NetworkFirst extends Strategy {
      /**
       * @param {Object} [options]
       * @param {string} [options.cacheName] Cache name to store and retrieve
       * requests. Defaults to cache names provided by
       * {@link workbox-core.cacheNames}.
       * @param {Array<Object>} [options.plugins] [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
       * to use in conjunction with this caching strategy.
       * @param {Object} [options.fetchOptions] Values passed along to the
       * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
       * of [non-navigation](https://github.com/GoogleChrome/workbox/issues/1796)
       * `fetch()` requests made by this strategy.
       * @param {Object} [options.matchOptions] [`CacheQueryOptions`](https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions)
       * @param {number} [options.networkTimeoutSeconds] If set, any network requests
       * that fail to respond within the timeout will fallback to the cache.
       *
       * This option can be used to combat
       * "[lie-fi]{@link https://developers.google.com/web/fundamentals/performance/poor-connectivity/#lie-fi}"
       * scenarios.
       */
      constructor(options = {}) {
        super(options);
        // If this instance contains no plugins with a 'cacheWillUpdate' callback,
        // prepend the `cacheOkAndOpaquePlugin` plugin to the plugins list.
        if (!this.plugins.some(p => 'cacheWillUpdate' in p)) {
          this.plugins.unshift(cacheOkAndOpaquePlugin);
        }
        this._networkTimeoutSeconds = options.networkTimeoutSeconds || 0;
        {
          if (this._networkTimeoutSeconds) {
            assert_js.assert.isType(this._networkTimeoutSeconds, 'number', {
              moduleName: 'workbox-strategies',
              className: this.constructor.name,
              funcName: 'constructor',
              paramName: 'networkTimeoutSeconds'
            });
          }
        }
      }
      /**
       * @private
       * @param {Request|string} request A request to run this strategy for.
       * @param {workbox-strategies.StrategyHandler} handler The event that
       *     triggered the request.
       * @return {Promise<Response>}
       */
      async _handle(request, handler) {
        const logs = [];
        {
          assert_js.assert.isInstance(request, Request, {
            moduleName: 'workbox-strategies',
            className: this.constructor.name,
            funcName: 'handle',
            paramName: 'makeRequest'
          });
        }
        const promises = [];
        let timeoutId;
        if (this._networkTimeoutSeconds) {
          const {
            id,
            promise
          } = this._getTimeoutPromise({
            request,
            logs,
            handler
          });
          timeoutId = id;
          promises.push(promise);
        }
        const networkPromise = this._getNetworkPromise({
          timeoutId,
          request,
          logs,
          handler
        });
        promises.push(networkPromise);
        const response = await handler.waitUntil((async () => {
          // Promise.race() will resolve as soon as the first promise resolves.
          return (await handler.waitUntil(Promise.race(promises))) || (
          // If Promise.race() resolved with null, it might be due to a network
          // timeout + a cache miss. If that were to happen, we'd rather wait until
          // the networkPromise resolves instead of returning null.
          // Note that it's fine to await an already-resolved promise, so we don't
          // have to check to see if it's still "in flight".
          await networkPromise);
        })());
        {
          logger_js.logger.groupCollapsed(messages.strategyStart(this.constructor.name, request));
          for (const log of logs) {
            logger_js.logger.log(log);
          }
          messages.printFinalResponse(response);
          logger_js.logger.groupEnd();
        }
        if (!response) {
          throw new WorkboxError_js.WorkboxError('no-response', {
            url: request.url
          });
        }
        return response;
      }
      /**
       * @param {Object} options
       * @param {Request} options.request
       * @param {Array} options.logs A reference to the logs array
       * @param {Event} options.event
       * @return {Promise<Response>}
       *
       * @private
       */
      _getTimeoutPromise({
        request,
        logs,
        handler
      }) {
        let timeoutId;
        const timeoutPromise = new Promise(resolve => {
          const onNetworkTimeout = async () => {
            {
              logs.push(`Timing out the network response at ` + `${this._networkTimeoutSeconds} seconds.`);
            }
            resolve(await handler.cacheMatch(request));
          };
          timeoutId = setTimeout(onNetworkTimeout, this._networkTimeoutSeconds * 1000);
        });
        return {
          promise: timeoutPromise,
          id: timeoutId
        };
      }
      /**
       * @param {Object} options
       * @param {number|undefined} options.timeoutId
       * @param {Request} options.request
       * @param {Array} options.logs A reference to the logs Array.
       * @param {Event} options.event
       * @return {Promise<Response>}
       *
       * @private
       */
      async _getNetworkPromise({
        timeoutId,
        request,
        logs,
        handler
      }) {
        let error;
        let response;
        try {
          response = await handler.fetchAndCachePut(request);
        } catch (fetchError) {
          if (fetchError instanceof Error) {
            error = fetchError;
          }
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        {
          if (response) {
            logs.push(`Got response from network.`);
          } else {
            logs.push(`Unable to get a response from the network. Will respond ` + `with a cached response.`);
          }
        }
        if (error || !response) {
          response = await handler.cacheMatch(request);
          {
            if (response) {
              logs.push(`Found a cached response in the '${this.cacheName}'` + ` cache.`);
            } else {
              logs.push(`No response found in the '${this.cacheName}' cache.`);
            }
          }
        }
        return response;
      }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * An implementation of a
     * [network-only](https://developer.chrome.com/docs/workbox/caching-strategies-overview/#network-only)
     * request strategy.
     *
     * This class is useful if you want to take advantage of any
     * [Workbox plugins](https://developer.chrome.com/docs/workbox/using-plugins/).
     *
     * If the network request fails, this will throw a `WorkboxError` exception.
     *
     * @extends workbox-strategies.Strategy
     * @memberof workbox-strategies
     */
    class NetworkOnly extends Strategy {
      /**
       * @param {Object} [options]
       * @param {Array<Object>} [options.plugins] [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
       * to use in conjunction with this caching strategy.
       * @param {Object} [options.fetchOptions] Values passed along to the
       * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
       * of [non-navigation](https://github.com/GoogleChrome/workbox/issues/1796)
       * `fetch()` requests made by this strategy.
       * @param {number} [options.networkTimeoutSeconds] If set, any network requests
       * that fail to respond within the timeout will result in a network error.
       */
      constructor(options = {}) {
        super(options);
        this._networkTimeoutSeconds = options.networkTimeoutSeconds || 0;
      }
      /**
       * @private
       * @param {Request|string} request A request to run this strategy for.
       * @param {workbox-strategies.StrategyHandler} handler The event that
       *     triggered the request.
       * @return {Promise<Response>}
       */
      async _handle(request, handler) {
        {
          assert_js.assert.isInstance(request, Request, {
            moduleName: 'workbox-strategies',
            className: this.constructor.name,
            funcName: '_handle',
            paramName: 'request'
          });
        }
        let error = undefined;
        let response;
        try {
          const promises = [handler.fetch(request)];
          if (this._networkTimeoutSeconds) {
            const timeoutPromise = timeout_js.timeout(this._networkTimeoutSeconds * 1000);
            promises.push(timeoutPromise);
          }
          response = await Promise.race(promises);
          if (!response) {
            throw new Error(`Timed out the network response after ` + `${this._networkTimeoutSeconds} seconds.`);
          }
        } catch (err) {
          if (err instanceof Error) {
            error = err;
          }
        }
        {
          logger_js.logger.groupCollapsed(messages.strategyStart(this.constructor.name, request));
          if (response) {
            logger_js.logger.log(`Got response from network.`);
          } else {
            logger_js.logger.log(`Unable to get a response from the network.`);
          }
          messages.printFinalResponse(response);
          logger_js.logger.groupEnd();
        }
        if (!response) {
          throw new WorkboxError_js.WorkboxError('no-response', {
            url: request.url,
            error
          });
        }
        return response;
      }
    }

    // @ts-ignore
    try {
      self['workbox:core:6.6.0'] && _();
    } catch (e) {}

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Claim any currently available clients once the service worker
     * becomes active. This is normally used in conjunction with `skipWaiting()`.
     *
     * @memberof workbox-core
     */
    function clientsClaim() {
      self.addEventListener('activate', () => self.clients.claim());
    }

    exports.NetworkFirst = NetworkFirst;
    exports.NetworkOnly = NetworkOnly;
    exports.clientsClaim = clientsClaim;
    exports.registerRoute = registerRoute;

}));
//# sourceMappingURL=workbox-ae07cd5b.js.map
