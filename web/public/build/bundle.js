
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /* node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.22.2 */

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32768) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let $routes;
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, "routes");
    	component_subscribe($$self, routes, value => $$invalidate(8, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(7, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(6, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ["basepath", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$base,
    		$location,
    		$routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 64) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			 {
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 384) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			 {
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		hasActiveRoute,
    		$base,
    		$location,
    		$routes,
    		locationContext,
    		routerContext,
    		activeRoute,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$$scope,
    		$$slots
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.22.2 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 2,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[1],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, routeParams, $location*/ 4114) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, get_default_slot_changes));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[1],
    		/*routeProps*/ ctx[2]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 22)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 2 && get_spread_object(/*routeParams*/ ctx[1]),
    					dirty & /*routeProps*/ 4 && get_spread_object(/*routeProps*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, value => $$invalidate(3, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Route", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("routeParams" in $$props) $$invalidate(1, routeParams = $$new_props.routeParams);
    		if ("routeProps" in $$props) $$invalidate(2, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 8) {
    			 if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(1, routeParams = $activeRoute.params);
    			}
    		}

    		 {
    			const { path, component, ...rest } = $$props;
    			$$invalidate(2, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		registerRoute,
    		unregisterRoute,
    		$$props,
    		$$scope,
    		$$slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/UploadPhoto.svelte generated by Svelte v3.22.2 */

    const { console: console_1 } = globals;
    const file = "src/UploadPhoto.svelte";

    // (85:37) 
    function create_if_block_1$1(ctx) {
    	let span;
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Il file è stato caricato a questo link ");
    			br = element("br");
    			t1 = text(/*url*/ ctx[2]);
    			add_location(br, file, 85, 74, 1943);
    			attr_dev(span, "id", "message");
    			attr_dev(span, "class", "svelte-teeumb");
    			add_location(span, file, 85, 16, 1885);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, br);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*url*/ 4) set_data_dev(t1, /*url*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(85:37) ",
    		ctx
    	});

    	return block;
    }

    // (83:12) {#if error !== void 0}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Si è verificato un errore nel caricare il file";
    			attr_dev(span, "id", "message");
    			attr_dev(span, "class", "svelte-teeumb");
    			add_location(span, file, 83, 16, 1758);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(83:12) {#if error !== void 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let i;
    	let t3;
    	let form;
    	let input0;
    	let t4;
    	let input1;
    	let br;
    	let t5;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*error*/ ctx[1] !== void 0) return create_if_block$1;
    		if (/*url*/ ctx[2] !== void 0) return create_if_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Carica una foto";
    			t1 = space();
    			i = element("i");
    			i.textContent = "close";
    			t3 = space();
    			form = element("form");
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			br = element("br");
    			t5 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "svelte-teeumb");
    			add_location(span, file, 73, 8, 1372);
    			attr_dev(i, "class", "material-icons svelte-teeumb");
    			add_location(i, file, 74, 8, 1409);
    			attr_dev(input0, "type", "file");
    			attr_dev(input0, "name", "image");
    			add_location(input0, file, 80, 12, 1608);
    			attr_dev(input1, "type", "submit");
    			input1.value = "Carica";
    			add_location(input1, file, 81, 12, 1665);
    			add_location(br, file, 81, 49, 1702);
    			add_location(form, file, 75, 8, 1470);
    			attr_dev(div0, "id", "popup");
    			attr_dev(div0, "class", "svelte-teeumb");
    			add_location(div0, file, 72, 4, 1347);
    			attr_dev(div1, "id", "overlay");
    			attr_dev(div1, "class", "svelte-teeumb");
    			add_location(div1, file, 71, 0, 1324);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div0, t1);
    			append_dev(div0, i);
    			append_dev(div0, t3);
    			append_dev(div0, form);
    			append_dev(form, input0);
    			append_dev(form, t4);
    			append_dev(form, input1);
    			append_dev(form, br);
    			append_dev(form, t5);
    			if (if_block) if_block.m(form, null);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(i, "click", /*close*/ ctx[3], false, false, false),
    				listen_dev(input0, "change", /*input0_change_handler*/ ctx[6]),
    				listen_dev(form, "submit", /*submit_handler*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(form, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block) {
    				if_block.d();
    			}

    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let files;
    	let error;
    	let url;

    	function close() {
    		dispatch("close");
    	}

    	async function upload() {
    		const formData = new FormData();
    		formData.append("image", files[0]);
    		console.log(files[0]);

    		const res = await fetch("/api/upload/image", {
    			credentials: "include",
    			method: "POST",
    			body: formData
    		});

    		const json = await res.json();
    		console.log(json);

    		if (!json.uploaded) {
    			$$invalidate(1, error = json.error);
    			return;
    		}

    		$$invalidate(2, url = json.url);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<UploadPhoto> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("UploadPhoto", $$slots, []);

    	function input0_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	const submit_handler = ev => {
    		ev.preventDefault();
    		ev.stopPropagation();
    		upload();
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		files,
    		error,
    		url,
    		close,
    		upload
    	});

    	$$self.$inject_state = $$props => {
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    		if ("url" in $$props) $$invalidate(2, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		files,
    		error,
    		url,
    		close,
    		upload,
    		dispatch,
    		input0_change_handler,
    		submit_handler
    	];
    }

    class UploadPhoto extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UploadPhoto",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/ArticleOrVideo.svelte generated by Svelte v3.22.2 */
    const file$1 = "src/ArticleOrVideo.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let span0;
    	let t1;
    	let i;
    	let t3;
    	let br;
    	let t4;
    	let div0;
    	let span1;
    	let a0;
    	let t6;
    	let span2;
    	let a1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Vuoi pubblicare un articolo o video?";
    			t1 = space();
    			i = element("i");
    			i.textContent = "close";
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			div0 = element("div");
    			span1 = element("span");
    			a0 = element("a");
    			a0.textContent = "VIDEO";
    			t6 = space();
    			span2 = element("span");
    			a1 = element("a");
    			a1.textContent = "ARTICOLO";
    			attr_dev(span0, "class", "modal-title svelte-n7tlue");
    			add_location(span0, file$1, 58, 8, 1121);
    			attr_dev(i, "class", "material-icons svelte-n7tlue");
    			add_location(i, file$1, 59, 8, 1199);
    			add_location(br, file$1, 60, 8, 1260);
    			attr_dev(a0, "href", "/upload/video");
    			attr_dev(a0, "title", "Carica un nuovo video");
    			attr_dev(a0, "class", "svelte-n7tlue");
    			add_location(a0, file$1, 62, 65, 1360);
    			attr_dev(span1, "class", "md-flat-button action svelte-n7tlue");
    			add_location(span1, file$1, 62, 12, 1307);
    			attr_dev(a1, "href", "/new");
    			attr_dev(a1, "title", "Scrivi un nuovo articolo");
    			attr_dev(a1, "class", "svelte-n7tlue");
    			add_location(a1, file$1, 63, 65, 1496);
    			attr_dev(span2, "class", "md-flat-button action svelte-n7tlue");
    			add_location(span2, file$1, 63, 12, 1443);
    			attr_dev(div0, "class", "actions svelte-n7tlue");
    			add_location(div0, file$1, 61, 8, 1273);
    			attr_dev(div1, "id", "popup");
    			attr_dev(div1, "class", "svelte-n7tlue");
    			add_location(div1, file$1, 57, 4, 1096);
    			attr_dev(div2, "id", "overlay");
    			attr_dev(div2, "class", "svelte-n7tlue");
    			add_location(div2, file$1, 56, 0, 1073);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t1);
    			append_dev(div1, i);
    			append_dev(div1, t3);
    			append_dev(div1, br);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, span1);
    			append_dev(span1, a0);
    			append_dev(div0, t6);
    			append_dev(div0, span2);
    			append_dev(span2, a1);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(i, "click", /*close*/ ctx[0], false, false, false),
    				listen_dev(span1, "click", /*close*/ ctx[0], false, false, false),
    				listen_dev(span2, "click", /*close*/ ctx[0], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	function close(choice) {
    		dispatch("close", choice);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ArticleOrVideo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ArticleOrVideo", $$slots, []);
    	$$self.$capture_state = () => ({ createEventDispatcher, dispatch, close });
    	return [close];
    }

    class ArticleOrVideo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ArticleOrVideo",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /**
     * The code was extracted from:
     * https://github.com/davidchambers/Base64.js
     */

    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    function InvalidCharacterError(message) {
      this.message = message;
    }

    InvalidCharacterError.prototype = new Error();
    InvalidCharacterError.prototype.name = 'InvalidCharacterError';

    function polyfill (input) {
      var str = String(input).replace(/=+$/, '');
      if (str.length % 4 == 1) {
        throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
      }
      for (
        // initialize result and counters
        var bc = 0, bs, buffer, idx = 0, output = '';
        // get next character
        buffer = str.charAt(idx++);
        // character found in table? initialize bit storage and add its ascii value;
        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
          // and if not first of each 4 characters,
          // convert the first 8 bits to one ascii character
          bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
      ) {
        // try to find character in table (0-63, not found => -1)
        buffer = chars.indexOf(buffer);
      }
      return output;
    }


    var atob = typeof window !== 'undefined' && window.atob && window.atob.bind(window) || polyfill;

    function b64DecodeUnicode(str) {
      return decodeURIComponent(atob(str).replace(/(.)/g, function (m, p) {
        var code = p.charCodeAt(0).toString(16).toUpperCase();
        if (code.length < 2) {
          code = '0' + code;
        }
        return '%' + code;
      }));
    }

    var base64_url_decode = function(str) {
      var output = str.replace(/-/g, "+").replace(/_/g, "/");
      switch (output.length % 4) {
        case 0:
          break;
        case 2:
          output += "==";
          break;
        case 3:
          output += "=";
          break;
        default:
          throw "Illegal base64url string!";
      }

      try{
        return b64DecodeUnicode(output);
      } catch (err) {
        return atob(output);
      }
    };

    function InvalidTokenError(message) {
      this.message = message;
    }

    InvalidTokenError.prototype = new Error();
    InvalidTokenError.prototype.name = 'InvalidTokenError';

    var lib = function (token,options) {
      if (typeof token !== 'string') {
        throw new InvalidTokenError('Invalid token specified');
      }

      options = options || {};
      var pos = options.header === true ? 0 : 1;
      try {
        return JSON.parse(base64_url_decode(token.split('.')[pos]));
      } catch (e) {
        throw new InvalidTokenError('Invalid token specified: ' + e.message);
      }
    };

    var InvalidTokenError_1 = InvalidTokenError;
    lib.InvalidTokenError = InvalidTokenError_1;

    /* src/Article.svelte generated by Svelte v3.22.2 */

    const file$2 = "src/Article.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span0;
    	let t1;
    	let t2;
    	let br0;
    	let t3;
    	let span1;
    	let t4;
    	let t5;
    	let br1;
    	let t6;
    	let div0;
    	let i;
    	let t8;
    	let span2;
    	let t9;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			br0 = element("br");
    			t3 = space();
    			span1 = element("span");
    			t4 = text(/*author*/ ctx[1]);
    			t5 = space();
    			br1 = element("br");
    			t6 = space();
    			div0 = element("div");
    			i = element("i");
    			i.textContent = "visibility";
    			t8 = space();
    			span2 = element("span");
    			t9 = text(/*views*/ ctx[3]);
    			attr_dev(img, "id", "thumbnail");
    			if (img.src !== (img_src_value = /*thumbnailUrl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*title*/ ctx[0]);
    			attr_dev(img, "class", "svelte-wzchlg");
    			add_location(img, file$2, 43, 8, 755);
    			attr_dev(span0, "id", "title");
    			attr_dev(span0, "class", "svelte-wzchlg");
    			add_location(span0, file$2, 45, 12, 844);
    			add_location(br0, file$2, 47, 19, 901);
    			attr_dev(span1, "id", "author");
    			attr_dev(span1, "class", "svelte-wzchlg");
    			add_location(span1, file$2, 48, 12, 918);
    			add_location(br1, file$2, 50, 19, 981);
    			attr_dev(i, "class", "material-icons svelte-wzchlg");
    			add_location(i, file$2, 52, 16, 1034);
    			attr_dev(span2, "id", "views-counter");
    			attr_dev(span2, "class", "svelte-wzchlg");
    			add_location(span2, file$2, 53, 16, 1091);
    			attr_dev(div0, "class", "views svelte-wzchlg");
    			add_location(div0, file$2, 51, 12, 998);
    			attr_dev(div1, "id", "right");
    			attr_dev(div1, "class", "svelte-wzchlg");
    			add_location(div1, file$2, 44, 8, 815);
    			attr_dev(div2, "id", "article");
    			attr_dev(div2, "class", "svelte-wzchlg");
    			add_location(div2, file$2, 42, 4, 728);
    			add_location(main, file$2, 41, 0, 717);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(span0, t1);
    			append_dev(span0, t2);
    			append_dev(div1, br0);
    			append_dev(div1, t3);
    			append_dev(div1, span1);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			append_dev(div1, br1);
    			append_dev(div1, t6);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div0, t8);
    			append_dev(div0, span2);
    			append_dev(span2, t9);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*thumbnailUrl*/ 4 && img.src !== (img_src_value = /*thumbnailUrl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*title*/ 1) {
    				attr_dev(img, "alt", /*title*/ ctx[0]);
    			}

    			if (dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);
    			if (dirty & /*author*/ 2) set_data_dev(t4, /*author*/ ctx[1]);
    			if (dirty & /*views*/ 8) set_data_dev(t9, /*views*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { title } = $$props;
    	let { author } = $$props;
    	let { thumbnailUrl } = $$props;
    	let { views } = $$props;
    	const writable_props = ["title", "author", "thumbnailUrl", "views"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Article> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Article", $$slots, []);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("author" in $$props) $$invalidate(1, author = $$props.author);
    		if ("thumbnailUrl" in $$props) $$invalidate(2, thumbnailUrl = $$props.thumbnailUrl);
    		if ("views" in $$props) $$invalidate(3, views = $$props.views);
    	};

    	$$self.$capture_state = () => ({ title, author, thumbnailUrl, views });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("author" in $$props) $$invalidate(1, author = $$props.author);
    		if ("thumbnailUrl" in $$props) $$invalidate(2, thumbnailUrl = $$props.thumbnailUrl);
    		if ("views" in $$props) $$invalidate(3, views = $$props.views);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, author, thumbnailUrl, views];
    }

    class Article extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			title: 0,
    			author: 1,
    			thumbnailUrl: 2,
    			views: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Article",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Article> was created without expected prop 'title'");
    		}

    		if (/*author*/ ctx[1] === undefined && !("author" in props)) {
    			console.warn("<Article> was created without expected prop 'author'");
    		}

    		if (/*thumbnailUrl*/ ctx[2] === undefined && !("thumbnailUrl" in props)) {
    			console.warn("<Article> was created without expected prop 'thumbnailUrl'");
    		}

    		if (/*views*/ ctx[3] === undefined && !("views" in props)) {
    			console.warn("<Article> was created without expected prop 'views'");
    		}
    	}

    	get title() {
    		throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get author() {
    		throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set author(value) {
    		throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thumbnailUrl() {
    		throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thumbnailUrl(value) {
    		throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get views() {
    		throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set views(value) {
    		throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Sputo.svelte generated by Svelte v3.22.2 */

    const file$3 = "src/Sputo.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let p;
    	let span;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			main = element("main");
    			p = element("p");
    			span = element("span");
    			t0 = text(/*date*/ ctx[1]);
    			t1 = space();
    			t2 = text(/*text*/ ctx[0]);
    			attr_dev(span, "id", "time");
    			attr_dev(span, "class", "svelte-u99n95");
    			add_location(span, file$3, 20, 8, 229);
    			attr_dev(p, "id", "sputo");
    			attr_dev(p, "class", "svelte-u99n95");
    			add_location(p, file$3, 19, 4, 206);
    			attr_dev(main, "class", "svelte-u99n95");
    			add_location(main, file$3, 18, 0, 195);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, p);
    			append_dev(p, span);
    			append_dev(span, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*date*/ 2) set_data_dev(t0, /*date*/ ctx[1]);
    			if (dirty & /*text*/ 1) set_data_dev(t2, /*text*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { text } = $$props;
    	let { date } = $$props;
    	const writable_props = ["text", "date"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sputo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sputo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("date" in $$props) $$invalidate(1, date = $$props.date);
    	};

    	$$self.$capture_state = () => ({ text, date });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("date" in $$props) $$invalidate(1, date = $$props.date);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, date];
    }

    class Sputo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { text: 0, date: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sputo",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<Sputo> was created without expected prop 'text'");
    		}

    		if (/*date*/ ctx[1] === undefined && !("date" in props)) {
    			console.warn("<Sputo> was created without expected prop 'date'");
    		}
    	}

    	get text() {
    		throw new Error("<Sputo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Sputo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<Sputo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Sputo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Video.svelte generated by Svelte v3.22.2 */

    const file$4 = "src/Video.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let div1;
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let span0;
    	let t1;
    	let t2;
    	let br;
    	let t3;
    	let span1;
    	let t4;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			span0 = element("span");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			br = element("br");
    			t3 = space();
    			span1 = element("span");
    			t4 = text(/*author*/ ctx[1]);
    			attr_dev(img, "id", "thumbnail");
    			if (img.src !== (img_src_value = /*thumbnailUrl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*title*/ ctx[0]);
    			attr_dev(img, "class", "svelte-vt8dk9");
    			add_location(img, file$4, 32, 51, 572);
    			attr_dev(a, "href", /*videoUrl*/ ctx[3]);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "title", /*title*/ ctx[0]);
    			add_location(a, file$4, 32, 8, 529);
    			attr_dev(span0, "id", "title");
    			attr_dev(span0, "class", "svelte-vt8dk9");
    			add_location(span0, file$4, 34, 12, 665);
    			add_location(br, file$4, 36, 19, 722);
    			attr_dev(span1, "id", "author");
    			attr_dev(span1, "class", "svelte-vt8dk9");
    			add_location(span1, file$4, 37, 12, 739);
    			attr_dev(div0, "id", "right");
    			attr_dev(div0, "class", "svelte-vt8dk9");
    			add_location(div0, file$4, 33, 8, 636);
    			attr_dev(div1, "id", "article");
    			attr_dev(div1, "class", "svelte-vt8dk9");
    			add_location(div1, file$4, 31, 4, 502);
    			add_location(main, file$4, 30, 0, 491);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, a);
    			append_dev(a, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t1);
    			append_dev(span0, t2);
    			append_dev(div0, br);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(span1, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*thumbnailUrl*/ 4 && img.src !== (img_src_value = /*thumbnailUrl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*title*/ 1) {
    				attr_dev(img, "alt", /*title*/ ctx[0]);
    			}

    			if (dirty & /*videoUrl*/ 8) {
    				attr_dev(a, "href", /*videoUrl*/ ctx[3]);
    			}

    			if (dirty & /*title*/ 1) {
    				attr_dev(a, "title", /*title*/ ctx[0]);
    			}

    			if (dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);
    			if (dirty & /*author*/ 2) set_data_dev(t4, /*author*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { title } = $$props;
    	let { author } = $$props;
    	let { thumbnailUrl } = $$props;
    	let { videoUrl } = $$props;
    	const writable_props = ["title", "author", "thumbnailUrl", "videoUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Video> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Video", $$slots, []);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("author" in $$props) $$invalidate(1, author = $$props.author);
    		if ("thumbnailUrl" in $$props) $$invalidate(2, thumbnailUrl = $$props.thumbnailUrl);
    		if ("videoUrl" in $$props) $$invalidate(3, videoUrl = $$props.videoUrl);
    	};

    	$$self.$capture_state = () => ({ title, author, thumbnailUrl, videoUrl });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("author" in $$props) $$invalidate(1, author = $$props.author);
    		if ("thumbnailUrl" in $$props) $$invalidate(2, thumbnailUrl = $$props.thumbnailUrl);
    		if ("videoUrl" in $$props) $$invalidate(3, videoUrl = $$props.videoUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, author, thumbnailUrl, videoUrl];
    }

    class Video extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			title: 0,
    			author: 1,
    			thumbnailUrl: 2,
    			videoUrl: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Video",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Video> was created without expected prop 'title'");
    		}

    		if (/*author*/ ctx[1] === undefined && !("author" in props)) {
    			console.warn("<Video> was created without expected prop 'author'");
    		}

    		if (/*thumbnailUrl*/ ctx[2] === undefined && !("thumbnailUrl" in props)) {
    			console.warn("<Video> was created without expected prop 'thumbnailUrl'");
    		}

    		if (/*videoUrl*/ ctx[3] === undefined && !("videoUrl" in props)) {
    			console.warn("<Video> was created without expected prop 'videoUrl'");
    		}
    	}

    	get title() {
    		throw new Error("<Video>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Video>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get author() {
    		throw new Error("<Video>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set author(value) {
    		throw new Error("<Video>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thumbnailUrl() {
    		throw new Error("<Video>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thumbnailUrl(value) {
    		throw new Error("<Video>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get videoUrl() {
    		throw new Error("<Video>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set videoUrl(value) {
    		throw new Error("<Video>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Home.svelte generated by Svelte v3.22.2 */

    const { console: console_1$1 } = globals;
    const file$5 = "src/Home.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (119:3) {:else}
    function create_else_block_4(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block_2,
    		then: create_then_block_2,
    		catch: create_catch_block_2,
    		value: 2,
    		error: 15,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*lastArticles*/ ctx[2], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*lastArticles*/ 4 && promise !== (promise = /*lastArticles*/ ctx[2]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[2] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4.name,
    		type: "else",
    		source: "(119:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (117:3) {#if lastArticles === undefined}
    function create_if_block_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(117:3) {#if lastArticles === undefined}",
    		ctx
    	});

    	return block;
    }

    // (126:4) {:catch err}
    function create_catch_block_2(ctx) {
    	let t_value = /*err*/ ctx[15].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lastArticles*/ 4 && t_value !== (t_value = /*err*/ ctx[15].message + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_2.name,
    		type: "catch",
    		source: "(126:4) {:catch err}",
    		ctx
    	});

    	return block;
    }

    // (122:4) {:then lastArticles}
    function create_then_block_2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_2 = /*lastArticles*/ ctx[2].data;
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lastArticles*/ 4) {
    				each_value_2 = /*lastArticles*/ ctx[2].data;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_2.name,
    		type: "then",
    		source: "(122:4) {:then lastArticles}",
    		ctx
    	});

    	return block;
    }

    // (123:5) {#each lastArticles.data as article,i}
    function create_each_block_2(ctx) {
    	let current;

    	const article = new Article({
    			props: {
    				thumbnailUrl: /*article*/ ctx[21].thumnail_url,
    				title: /*article*/ ctx[21].title,
    				author: /*article*/ ctx[21].author,
    				views: /*article*/ ctx[21].views
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(article.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(article, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const article_changes = {};
    			if (dirty & /*lastArticles*/ 4) article_changes.thumbnailUrl = /*article*/ ctx[21].thumnail_url;
    			if (dirty & /*lastArticles*/ 4) article_changes.title = /*article*/ ctx[21].title;
    			if (dirty & /*lastArticles*/ 4) article_changes.author = /*article*/ ctx[21].author;
    			if (dirty & /*lastArticles*/ 4) article_changes.views = /*article*/ ctx[21].views;
    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(article, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(123:5) {#each lastArticles.data as article,i}",
    		ctx
    	});

    	return block;
    }

    // (120:25)       Loading...     {:then lastArticles}
    function create_pending_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_2.name,
    		type: "pending",
    		source: "(120:25)       Loading...     {:then lastArticles}",
    		ctx
    	});

    	return block;
    }

    // (134:3) {:else}
    function create_else_block_2(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_1,
    		value: 3,
    		error: 15,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*sputi*/ ctx[3], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*sputi*/ 8 && promise !== (promise = /*sputi*/ ctx[3]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[3] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(134:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (132:3) {#if sputi === undefined}
    function create_if_block_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(132:3) {#if sputi === undefined}",
    		ctx
    	});

    	return block;
    }

    // (145:4) {:catch err}
    function create_catch_block_1(ctx) {
    	let t_value = /*err*/ ctx[15].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sputi*/ 8 && t_value !== (t_value = /*err*/ ctx[15].message + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(145:4) {:catch err}",
    		ctx
    	});

    	return block;
    }

    // (137:4) {:then sputi}
    function create_then_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_5, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*sputi*/ ctx[3].data.length != 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(137:4) {:then sputi}",
    		ctx
    	});

    	return block;
    }

    // (142:5) {:else}
    function create_else_block_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Ancora nessuno sputo");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(142:5) {:else}",
    		ctx
    	});

    	return block;
    }

    // (138:5) {#if sputi.data.length != 0}
    function create_if_block_5(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*sputi*/ ctx[3].data;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*timeConverter, sputi*/ 8) {
    				each_value_1 = /*sputi*/ ctx[3].data;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(138:5) {#if sputi.data.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (139:6) {#each sputi.data as sputo,i}
    function create_each_block_1(ctx) {
    	let current;

    	const sputo = new Sputo({
    			props: {
    				date: timeConverter(/*sputo*/ ctx[19].timestamp),
    				text: /*sputo*/ ctx[19].text
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sputo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sputo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sputo_changes = {};
    			if (dirty & /*sputi*/ 8) sputo_changes.date = timeConverter(/*sputo*/ ctx[19].timestamp);
    			if (dirty & /*sputi*/ 8) sputo_changes.text = /*sputo*/ ctx[19].text;
    			sputo.$set(sputo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sputo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sputo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sputo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(139:6) {#each sputi.data as sputo,i}",
    		ctx
    	});

    	return block;
    }

    // (135:18)       Loading...     {:then sputi}
    function create_pending_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(135:18)       Loading...     {:then sputi}",
    		ctx
    	});

    	return block;
    }

    // (153:3) {:else}
    function create_else_block$1(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 4,
    		error: 15,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*videos*/ ctx[4], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*videos*/ 16 && promise !== (promise = /*videos*/ ctx[4]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[4] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(153:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (151:3) {#if videos === undefined}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(151:3) {#if videos === undefined}",
    		ctx
    	});

    	return block;
    }

    // (164:4) {:catch err}
    function create_catch_block(ctx) {
    	let t_value = /*err*/ ctx[15].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videos*/ 16 && t_value !== (t_value = /*err*/ ctx[15].message + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(164:4) {:catch err}",
    		ctx
    	});

    	return block;
    }

    // (156:4) {:then videos}
    function create_then_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_3, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_4(ctx, dirty) {
    		if (/*videos*/ ctx[4].data.length != 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_4(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_4(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(156:4) {:then videos}",
    		ctx
    	});

    	return block;
    }

    // (161:5) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Non è stato pubblicato nessun video");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(161:5) {:else}",
    		ctx
    	});

    	return block;
    }

    // (157:5) {#if videos.data.length != 0}
    function create_if_block_3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*videos*/ ctx[4].data;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videos*/ 16) {
    				each_value = /*videos*/ ctx[4].data;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(157:5) {#if videos.data.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (158:6) {#each videos.data as video,i}
    function create_each_block(ctx) {
    	let current;

    	const video = new Video({
    			props: {
    				thumbnailUrl: /*video*/ ctx[16].thumbnailUrl,
    				title: /*video*/ ctx[16].title,
    				author: /*video*/ ctx[16].author,
    				videoUrl: /*video*/ ctx[16].videoUrl
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(video.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(video, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const video_changes = {};
    			if (dirty & /*videos*/ 16) video_changes.thumbnailUrl = /*video*/ ctx[16].thumbnailUrl;
    			if (dirty & /*videos*/ 16) video_changes.title = /*video*/ ctx[16].title;
    			if (dirty & /*videos*/ 16) video_changes.author = /*video*/ ctx[16].author;
    			if (dirty & /*videos*/ 16) video_changes.videoUrl = /*video*/ ctx[16].videoUrl;
    			video.$set(video_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(video.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(video.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(video, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(158:6) {#each videos.data as video,i}",
    		ctx
    	});

    	return block;
    }

    // (154:19)       Loading...     {:then videos}
    function create_pending_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(154:19)       Loading...     {:then videos}",
    		ctx
    	});

    	return block;
    }

    // (170:1) {#if uploadPhotoOpen}
    function create_if_block_1$2(ctx) {
    	let current;
    	const uploadphoto = new UploadPhoto({ $$inline: true });
    	uploadphoto.$on("close", /*close_handler*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(uploadphoto.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(uploadphoto, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(uploadphoto.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(uploadphoto.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(uploadphoto, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(170:1) {#if uploadPhotoOpen}",
    		ctx
    	});

    	return block;
    }

    // (173:1) {#if choiceOpen}
    function create_if_block$2(ctx) {
    	let current;
    	const articleorvideo = new ArticleOrVideo({ $$inline: true });
    	articleorvideo.$on("close", /*close_handler_1*/ ctx[14]);

    	const block = {
    		c: function create() {
    			create_component(articleorvideo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(articleorvideo, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(articleorvideo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(articleorvideo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(articleorvideo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(173:1) {#if choiceOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let nav;
    	let img;
    	let img_src_value;
    	let t0;
    	let span0;
    	let t3;
    	let i0;
    	let t5;
    	let i1;
    	let t7;
    	let div3;
    	let div0;
    	let span1;
    	let br0;
    	let t9;
    	let current_block_type_index;
    	let if_block0;
    	let t10;
    	let div1;
    	let span2;
    	let br1;
    	let t12;
    	let current_block_type_index_1;
    	let if_block1;
    	let t13;
    	let div2;
    	let span3;
    	let br2;
    	let t15;
    	let current_block_type_index_2;
    	let if_block2;
    	let t16;
    	let t17;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_6, create_else_block_4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*lastArticles*/ ctx[2] === undefined) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block_4, create_else_block_2];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*sputi*/ ctx[3] === undefined) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	const if_block_creators_2 = [create_if_block_2, create_else_block$1];
    	const if_blocks_2 = [];

    	function select_block_type_3(ctx, dirty) {
    		if (/*videos*/ ctx[4] === undefined) return 0;
    		return 1;
    	}

    	current_block_type_index_2 = select_block_type_3(ctx);
    	if_block2 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);
    	let if_block3 = /*uploadPhotoOpen*/ ctx[0] && create_if_block_1$2(ctx);
    	let if_block4 = /*choiceOpen*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			nav = element("nav");
    			img = element("img");
    			t0 = space();
    			span0 = element("span");
    			span0.textContent = `Benvenuto, ${/*session*/ ctx[5].name}`;
    			t3 = space();
    			i0 = element("i");
    			i0.textContent = "add";
    			t5 = space();
    			i1 = element("i");
    			i1.textContent = "cloud_upload";
    			t7 = space();
    			div3 = element("div");
    			div0 = element("div");
    			span1 = element("span");
    			span1.textContent = "Ultimi articoli";
    			br0 = element("br");
    			t9 = space();
    			if_block0.c();
    			t10 = space();
    			div1 = element("div");
    			span2 = element("span");
    			span2.textContent = "Ultimi sputi";
    			br1 = element("br");
    			t12 = space();
    			if_block1.c();
    			t13 = space();
    			div2 = element("div");
    			span3 = element("span");
    			span3.textContent = "Ultimi video";
    			br2 = element("br");
    			t15 = space();
    			if_block2.c();
    			t16 = space();
    			if (if_block3) if_block3.c();
    			t17 = space();
    			if (if_block4) if_block4.c();
    			if (img.src !== (img_src_value = "/logo-medium.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "id", "logo");
    			attr_dev(img, "class", "svelte-8gab7c");
    			add_location(img, file$5, 107, 2, 2562);
    			attr_dev(span0, "id", "welcome");
    			attr_dev(span0, "class", "svelte-8gab7c");
    			add_location(span0, file$5, 108, 2, 2614);
    			attr_dev(i0, "class", "material-icons svelte-8gab7c");
    			add_location(i0, file$5, 109, 2, 2668);
    			attr_dev(i1, "class", "material-icons svelte-8gab7c");
    			add_location(i1, file$5, 110, 2, 2746);
    			attr_dev(nav, "class", "svelte-8gab7c");
    			add_location(nav, file$5, 106, 1, 2554);
    			attr_dev(span1, "class", "section svelte-8gab7c");
    			add_location(span1, file$5, 115, 3, 2883);
    			add_location(br0, file$5, 115, 47, 2927);
    			add_location(div0, file$5, 114, 2, 2874);
    			attr_dev(span2, "class", "section svelte-8gab7c");
    			add_location(span2, file$5, 130, 7, 3322);
    			add_location(br1, file$5, 130, 48, 3363);
    			add_location(div1, file$5, 130, 2, 3317);
    			attr_dev(span3, "class", "section svelte-8gab7c");
    			add_location(span3, file$5, 149, 7, 3764);
    			add_location(br2, file$5, 149, 48, 3805);
    			add_location(div2, file$5, 149, 2, 3759);
    			attr_dev(div3, "id", "content");
    			attr_dev(div3, "class", "svelte-8gab7c");
    			add_location(div3, file$5, 113, 1, 2853);
    			add_location(main, file$5, 105, 0, 2546);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, nav);
    			append_dev(nav, img);
    			append_dev(nav, t0);
    			append_dev(nav, span0);
    			append_dev(nav, t3);
    			append_dev(nav, i0);
    			append_dev(nav, t5);
    			append_dev(nav, i1);
    			append_dev(main, t7);
    			append_dev(main, div3);
    			append_dev(div3, div0);
    			append_dev(div0, span1);
    			append_dev(div0, br0);
    			append_dev(div0, t9);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div3, t10);
    			append_dev(div3, div1);
    			append_dev(div1, span2);
    			append_dev(div1, br1);
    			append_dev(div1, t12);
    			if_blocks_1[current_block_type_index_1].m(div1, null);
    			append_dev(div3, t13);
    			append_dev(div3, div2);
    			append_dev(div2, span3);
    			append_dev(div2, br2);
    			append_dev(div2, t15);
    			if_blocks_2[current_block_type_index_2].m(div2, null);
    			append_dev(main, t16);
    			if (if_block3) if_block3.m(main, null);
    			append_dev(main, t17);
    			if (if_block4) if_block4.m(main, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(i0, "click", /*click_handler*/ ctx[11], false, false, false),
    				listen_dev(i1, "click", /*click_handler_1*/ ctx[12], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div0, null);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks_1[current_block_type_index_1];

    				if (!if_block1) {
    					if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div1, null);
    			}

    			let previous_block_index_2 = current_block_type_index_2;
    			current_block_type_index_2 = select_block_type_3(ctx);

    			if (current_block_type_index_2 === previous_block_index_2) {
    				if_blocks_2[current_block_type_index_2].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_2[previous_block_index_2], 1, 1, () => {
    					if_blocks_2[previous_block_index_2] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks_2[current_block_type_index_2];

    				if (!if_block2) {
    					if_block2 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);
    					if_block2.c();
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div2, null);
    			}

    			if (/*uploadPhotoOpen*/ ctx[0]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*uploadPhotoOpen*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1$2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, t17);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*choiceOpen*/ ctx[1]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*choiceOpen*/ 2) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block$2(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(main, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			if_blocks_1[current_block_type_index_1].d();
    			if_blocks_2[current_block_type_index_2].d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getCookie(name) {
    	const value = `; ${document.cookie}`;
    	const parts = value.split(`; ${name}=`);
    	if (parts.length === 2) return parts.pop().split(";").shift();
    }

    function timeConverter(UNIX_timestamp) {
    	var a = new Date(parseInt(UNIX_timestamp));

    	var months = [
    		"Gen",
    		"Feb",
    		"Mar",
    		"Apr",
    		"Mag",
    		"Giu",
    		"Lug",
    		"Ago",
    		"Set",
    		"Ott",
    		"Nov",
    		"Dic"
    	];

    	var year = a.getFullYear();
    	var month = months[a.getMonth()];

    	var date = a.getDate().toString().length == 1
    	? `0${a.getDate()}`
    	: a.getDate();

    	var hour = a.getHours().toString().length == 1
    	? `0${a.getHours()}`
    	: a.getHours();

    	var min = a.getMinutes().toString().length == 1
    	? `0${a.getMinutes()}`
    	: a.getMinutes();

    	var sec = a.getSeconds().toString().length == 1
    	? `0${a.getSeconds()}`
    	: a.getSeconds();

    	var time = date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
    	return time;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const cookie = getCookie("session");
    	const session = lib(cookie);
    	let uploadPhotoOpen = false;
    	let choiceOpen = false;
    	let lastArticles;
    	let sputi;
    	let videos;

    	function choiceClosed(reply) {
    		console.log(reply);
    		$$invalidate(1, choiceOpen = !choiceOpen);
    		if (reply == undefined || reply == null) return;
    		if (reply == "article") document.href = "/new";
    	} //if(reply == "video") 

    	async function getLastArticles() {
    		let response = await fetch("/api/articles");
    		$$invalidate(2, lastArticles = await response.json());
    	}

    	getLastArticles();

    	async function getSputi() {
    		let response = await fetch("/api/sputi");
    		$$invalidate(3, sputi = await response.json());
    		console.log(sputi.data);
    	}

    	getSputi();

    	setInterval(
    		() => {
    			getSputi();
    		},
    		2000
    	);

    	async function getVideos() {
    		let response = await fetch("/api/videos");
    		$$invalidate(4, videos = await response.json());
    	}

    	getVideos();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);
    	const click_handler = () => $$invalidate(1, choiceOpen = !choiceOpen);
    	const click_handler_1 = () => $$invalidate(0, uploadPhotoOpen = !uploadPhotoOpen);
    	const close_handler = () => $$invalidate(0, uploadPhotoOpen = !uploadPhotoOpen);
    	const close_handler_1 = reply => choiceClosed(reply);

    	$$self.$capture_state = () => ({
    		UploadPhoto,
    		ArticleOrVideo,
    		jwtDecode: lib,
    		Article,
    		Sputo,
    		Video,
    		cookie,
    		session,
    		uploadPhotoOpen,
    		choiceOpen,
    		lastArticles,
    		sputi,
    		videos,
    		choiceClosed,
    		getCookie,
    		getLastArticles,
    		getSputi,
    		getVideos,
    		timeConverter
    	});

    	$$self.$inject_state = $$props => {
    		if ("uploadPhotoOpen" in $$props) $$invalidate(0, uploadPhotoOpen = $$props.uploadPhotoOpen);
    		if ("choiceOpen" in $$props) $$invalidate(1, choiceOpen = $$props.choiceOpen);
    		if ("lastArticles" in $$props) $$invalidate(2, lastArticles = $$props.lastArticles);
    		if ("sputi" in $$props) $$invalidate(3, sputi = $$props.sputi);
    		if ("videos" in $$props) $$invalidate(4, videos = $$props.videos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		uploadPhotoOpen,
    		choiceOpen,
    		lastArticles,
    		sputi,
    		videos,
    		session,
    		choiceClosed,
    		cookie,
    		getLastArticles,
    		getSputi,
    		getVideos,
    		click_handler,
    		click_handler_1,
    		close_handler,
    		close_handler_1
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Login.svelte generated by Svelte v3.22.2 */

    const { Error: Error_1 } = globals;
    const file$6 = "src/Login.svelte";

    // (70:16) {#if loginStatus}
    function create_if_block$3(ctx) {
    	let await_block_anchor;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 7,
    		error: 8
    	};

    	handle_promise(promise = /*loginStatus*/ ctx[2], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*loginStatus*/ 4 && promise !== (promise = /*loginStatus*/ ctx[2]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[7] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(70:16) {#if loginStatus}",
    		ctx
    	});

    	return block;
    }

    // (75:20) {:catch err}
    function create_catch_block$1(ctx) {
    	let t_value = /*err*/ ctx[8].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*loginStatus*/ 4 && t_value !== (t_value = /*err*/ ctx[8].message + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(75:20) {:catch err}",
    		ctx
    	});

    	return block;
    }

    // (73:20) {:then _}
    function create_then_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loggato");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(73:20) {:then _}",
    		ctx
    	});

    	return block;
    }

    // (71:40)                          Login...                     {:then _}
    function create_pending_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Login...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(71:40)                          Login...                     {:then _}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let main;
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let form;
    	let span0;
    	let br0;
    	let t2;
    	let input0;
    	let br1;
    	let t3;
    	let input1;
    	let br2;
    	let t4;
    	let span1;
    	let t5;
    	let input2;
    	let dispose;
    	let if_block = /*loginStatus*/ ctx[2] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			form = element("form");
    			span0 = element("span");
    			span0.textContent = "Perfavore, effettua il login per continuare";
    			br0 = element("br");
    			t2 = space();
    			input0 = element("input");
    			br1 = element("br");
    			t3 = space();
    			input1 = element("input");
    			br2 = element("br");
    			t4 = space();
    			span1 = element("span");
    			if (if_block) if_block.c();
    			t5 = space();
    			input2 = element("input");
    			if (img.src !== (img_src_value = "/logo-medium.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "id", "logo");
    			attr_dev(img, "class", "svelte-65i4wv");
    			add_location(img, file$6, 60, 8, 1073);
    			attr_dev(span0, "id", "welcome");
    			add_location(span0, file$6, 65, 12, 1247);
    			add_location(br0, file$6, 65, 81, 1316);
    			attr_dev(input0, "placeholder", "Username");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-65i4wv");
    			add_location(input0, file$6, 66, 12, 1333);
    			add_location(br1, file$6, 66, 77, 1398);
    			attr_dev(input1, "placeholder", "Password");
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "class", "svelte-65i4wv");
    			add_location(input1, file$6, 67, 12, 1415);
    			add_location(br2, file$6, 67, 81, 1484);
    			attr_dev(span1, "id", "message");
    			attr_dev(span1, "class", "svelte-65i4wv");
    			add_location(span1, file$6, 68, 12, 1501);
    			attr_dev(input2, "type", "submit");
    			input2.value = "Login";
    			attr_dev(input2, "class", "svelte-65i4wv");
    			add_location(input2, file$6, 79, 12, 1845);
    			attr_dev(form, "class", "svelte-65i4wv");
    			add_location(form, file$6, 61, 8, 1131);
    			attr_dev(div, "id", "login");
    			attr_dev(div, "class", "svelte-65i4wv");
    			add_location(div, file$6, 59, 4, 1048);
    			add_location(main, file$6, 58, 0, 1037);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, form);
    			append_dev(form, span0);
    			append_dev(form, br0);
    			append_dev(form, t2);
    			append_dev(form, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append_dev(form, br1);
    			append_dev(form, t3);
    			append_dev(form, input1);
    			set_input_value(input1, /*password*/ ctx[1]);
    			append_dev(form, br2);
    			append_dev(form, t4);
    			append_dev(form, span1);
    			if (if_block) if_block.m(span1, null);
    			append_dev(form, t5);
    			append_dev(form, input2);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    				listen_dev(input2, "click", /*click_handler*/ ctx[6], false, false, false),
    				listen_dev(form, "submit", submit_handler, false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				set_input_value(input1, /*password*/ ctx[1]);
    			}

    			if (/*loginStatus*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(span1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const submit_handler = ev => {
    	ev.preventDefault();
    	ev.stopPropagation();
    };

    function instance$8($$self, $$props, $$invalidate) {
    	let username = "";
    	let password = "";
    	let loginStatus;

    	async function login() {
    		const formData = new URLSearchParams();
    		formData.append("username", username);
    		formData.append("password", password);

    		const res = await fetch("/api/login", {
    			method: "POST",
    			headers: {
    				"Content-Type": "application/x-www-form-urlencoded"
    			},
    			body: formData
    		});

    		const data = await res.json();

    		if (!data.logged) {
    			throw new Error(data.error);
    		}

    		location.href = "/";
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Login", $$slots, []);

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	const click_handler = () => $$invalidate(2, loginStatus = login());
    	$$self.$capture_state = () => ({ username, password, loginStatus, login });

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("password" in $$props) $$invalidate(1, password = $$props.password);
    		if ("loginStatus" in $$props) $$invalidate(2, loginStatus = $$props.loginStatus);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		password,
    		loginStatus,
    		login,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/New.svelte generated by Svelte v3.22.2 */

    const { console: console_1$2 } = globals;
    const file$7 = "src/New.svelte";

    function create_fragment$9(ctx) {
    	let main;
    	let div0;
    	let i0;
    	let t1;
    	let i1;
    	let t3;
    	let div1;
    	let ul;
    	let li0;
    	let i2;
    	let t5;
    	let li1;
    	let i3;
    	let t7;
    	let li2;
    	let i4;
    	let t9;
    	let li3;
    	let i5;
    	let t11;
    	let li4;
    	let i6;
    	let t13;
    	let div2;
    	let h1;
    	let t15;
    	let span;
    	let br;
    	let t17;
    	let textarea;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			i0 = element("i");
    			i0.textContent = "play_circle_filled";
    			t1 = space();
    			i1 = element("i");
    			i1.textContent = "send";
    			t3 = space();
    			div1 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			i2 = element("i");
    			i2.textContent = "title";
    			t5 = space();
    			li1 = element("li");
    			i3 = element("i");
    			i3.textContent = "text_fields";
    			t7 = space();
    			li2 = element("li");
    			i4 = element("i");
    			i4.textContent = "insert_photo";
    			t9 = space();
    			li3 = element("li");
    			i5 = element("i");
    			i5.textContent = "insert_link";
    			t11 = space();
    			li4 = element("li");
    			i6 = element("i");
    			i6.textContent = "collections";
    			t13 = space();
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Nome articolo";
    			t15 = space();
    			span = element("span");
    			span.textContent = "Autore: Gioele Pannetto";
    			br = element("br");
    			t17 = space();
    			textarea = element("textarea");
    			attr_dev(i0, "id", "preview");
    			attr_dev(i0, "title", "Visualizza anteprima");
    			attr_dev(i0, "class", "material-icons svelte-1lancky");
    			add_location(i0, file$7, 170, 8, 5192);
    			attr_dev(i1, "id", "send");
    			attr_dev(i1, "title", "Pubblica articolo");
    			attr_dev(i1, "class", "material-icons svelte-1lancky");
    			add_location(i1, file$7, 171, 8, 5318);
    			attr_dev(div0, "id", "actions");
    			attr_dev(div0, "class", "svelte-1lancky");
    			add_location(div0, file$7, 169, 4, 5165);
    			attr_dev(i2, "title", "Aggiungi titolo primario");
    			attr_dev(i2, "class", "material-icons svelte-1lancky");
    			attr_dev(i2, "id", "add_title");
    			add_location(i2, file$7, 175, 16, 5476);
    			attr_dev(li0, "class", "svelte-1lancky");
    			add_location(li0, file$7, 175, 12, 5472);
    			attr_dev(i3, "title", "Aggiungi sottotitolo");
    			attr_dev(i3, "class", "material-icons svelte-1lancky");
    			attr_dev(i3, "id", "add_subtitle");
    			add_location(i3, file$7, 176, 16, 5625);
    			attr_dev(li1, "class", "svelte-1lancky");
    			add_location(li1, file$7, 176, 12, 5621);
    			attr_dev(i4, "title", "Aggiungi immagine");
    			attr_dev(i4, "class", "material-icons svelte-1lancky");
    			attr_dev(i4, "id", "add_image");
    			add_location(i4, file$7, 177, 16, 5780);
    			attr_dev(li2, "class", "svelte-1lancky");
    			add_location(li2, file$7, 177, 12, 5776);
    			attr_dev(i5, "title", "Aggiungi link");
    			attr_dev(i5, "class", "material-icons svelte-1lancky");
    			attr_dev(i5, "id", "add_link");
    			add_location(i5, file$7, 178, 16, 5916);
    			attr_dev(li3, "class", "svelte-1lancky");
    			add_location(li3, file$7, 178, 12, 5912);
    			attr_dev(i6, "title", "Aggiungi immagine con link");
    			attr_dev(i6, "class", "material-icons svelte-1lancky");
    			attr_dev(i6, "id", "add_image_link");
    			add_location(i6, file$7, 179, 16, 6045);
    			attr_dev(li4, "class", "svelte-1lancky");
    			add_location(li4, file$7, 179, 12, 6041);
    			attr_dev(ul, "class", "svelte-1lancky");
    			add_location(ul, file$7, 174, 8, 5455);
    			attr_dev(div1, "id", "sidebar");
    			attr_dev(div1, "class", "svelte-1lancky");
    			add_location(div1, file$7, 173, 4, 5428);
    			attr_dev(h1, "contenteditable", "true");
    			attr_dev(h1, "id", "articleTitle");
    			attr_dev(h1, "tabindex", "1");
    			attr_dev(h1, "class", "svelte-1lancky");
    			add_location(h1, file$7, 183, 8, 6235);
    			attr_dev(span, "id", "author");
    			attr_dev(span, "class", "svelte-1lancky");
    			add_location(span, file$7, 184, 8, 6320);
    			add_location(br, file$7, 184, 56, 6368);
    			attr_dev(textarea, "id", "text");
    			attr_dev(textarea, "tabindex", "2");
    			textarea.value = "#Titolo primario";
    			attr_dev(textarea, "class", "svelte-1lancky");
    			add_location(textarea, file$7, 185, 8, 6381);
    			attr_dev(div2, "id", "root");
    			attr_dev(div2, "class", "svelte-1lancky");
    			add_location(div2, file$7, 182, 4, 6211);
    			attr_dev(main, "class", "svelte-1lancky");
    			add_location(main, file$7, 168, 0, 5154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, i0);
    			append_dev(div0, t1);
    			append_dev(div0, i1);
    			append_dev(main, t3);
    			append_dev(main, div1);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, i2);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, i3);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, i4);
    			append_dev(ul, t9);
    			append_dev(ul, li3);
    			append_dev(li3, i5);
    			append_dev(ul, t11);
    			append_dev(ul, li4);
    			append_dev(li4, i6);
    			append_dev(main, t13);
    			append_dev(main, div2);
    			append_dev(div2, h1);
    			append_dev(div2, t15);
    			append_dev(div2, span);
    			append_dev(div2, br);
    			append_dev(div2, t17);
    			append_dev(div2, textarea);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(i0, "click", /*click_handler*/ ctx[0], false, false, false),
    				listen_dev(i1, "click", /*click_handler_1*/ ctx[1], false, false, false),
    				listen_dev(i2, "click", /*click_handler_2*/ ctx[2], false, false, false),
    				listen_dev(i3, "click", /*click_handler_3*/ ctx[3], false, false, false),
    				listen_dev(i4, "click", /*click_handler_4*/ ctx[4], false, false, false),
    				listen_dev(i5, "click", /*click_handler_5*/ ctx[5], false, false, false),
    				listen_dev(i6, "click", /*click_handler_6*/ ctx[6], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function insertAtCaret(areaId, text) {
    	var txtarea = document.getElementById(areaId);

    	if (!txtarea) {
    		return;
    	}

    	var scrollPos = txtarea.scrollTop;
    	var strPos = 0;

    	var br = txtarea.selectionStart || txtarea.selectionStart == "0"
    	? "ff"
    	: document.selection ? "ie" : false;

    	if (br == "ie") {
    		txtarea.focus();
    		var range = document.selection.createRange();
    		range.moveStart("character", -txtarea.value.length);
    		strPos = range.text.length;
    	} else if (br == "ff") {
    		strPos = txtarea.selectionStart;
    	}

    	var front = txtarea.value.substring(0, strPos);
    	var back = txtarea.value.substring(strPos, txtarea.value.length);
    	txtarea.value = front + text + back;
    	strPos = strPos + text.length;

    	if (br == "ie") {
    		txtarea.focus();
    		var ieRange = document.selection.createRange();
    		ieRange.moveStart("character", -txtarea.value.length);
    		ieRange.moveStart("character", strPos);
    		ieRange.moveEnd("character", 0);
    		ieRange.select();
    	} else if (br == "ff") {
    		txtarea.selectionStart = strPos;
    		txtarea.selectionEnd = strPos;
    		txtarea.focus();
    	}

    	txtarea.scrollTop = scrollPos;
    }

    function insertImage() {
    	var image = prompt("Scrivi il link dell'immagine", "https://example.com/image.png");
    	insertAtCaret("text", `![image](${image})`);
    }

    function insertLink() {
    	var link = prompt("Scrivi il link", "https://example.com");
    	var linktext = prompt("Scrivi il testo del link", "Google");
    	insertAtCaret("text", `[${linktext}](${link})`);
    }

    function insertImageLink() {
    	var link = prompt("Scrivi il link", "https://example.com");
    	var linktext = prompt("Scrivi il testo del link", "Google");
    	insertAtCaret("text", `[${linktext}](${link})`);
    }

    function preview() {
    	var html_content = "";
    	html_content = markdown.toHTML(document.getElementById("text").value);
    	var win = window.open("", "Title", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=200,top=" + (screen.height - 400) + ",left=" + (screen.width - 840));
    	win.document.body.innerHTML = html_content;
    	win.document.head.innerHTML = "<link href=\"https://fonts.googleapis.com/css?family=Roboto+Slab&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"https://ggv.pangio.it/admin/new/static/preview.css\"><title>GGV Editor Preview</title>";
    }

    async function send() {
    	const formData = new URLSearchParams();
    	formData.append("title", document.getElementById("articleTitle").innerHTML);
    	console.log(document.getElementById("articleTitle").innerHTML);
    	formData.append("article", document.getElementById("text").value);
    	let image = prompt("Scrivi il link all'immagine", "https://example.com/image.png");

    	if (image === null) {
    		return;
    	}

    	formData.append("thumbnailUrl", image);

    	const res = await fetch("/api/new_article", {
    		credentials: "include",
    		headers: {
    			"Content-Type": "application/x-www-form-urlencoded"
    		},
    		method: "POST",
    		body: formData
    	});

    	console.log(await res.json());
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<New> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("New", $$slots, []);
    	const click_handler = () => preview();
    	const click_handler_1 = () => send();
    	const click_handler_2 = () => insertAtCaret("text", "#");
    	const click_handler_3 = () => insertAtCaret("text", "##");
    	const click_handler_4 = () => insertImage();
    	const click_handler_5 = () => insertLink();
    	const click_handler_6 = () => insertImageLink();

    	$$self.$capture_state = () => ({
    		insertAtCaret,
    		insertImage,
    		insertLink,
    		insertImageLink,
    		preview,
    		send
    	});

    	return [
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
    }

    class New extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "New",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/UploadVideo.svelte generated by Svelte v3.22.2 */

    const { console: console_1$3 } = globals;
    const file$8 = "src/UploadVideo.svelte";

    // (85:34) 
    function create_if_block_1$3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Il video è stato caricato";
    			attr_dev(span, "id", "message");
    			attr_dev(span, "class", "svelte-teeumb");
    			add_location(span, file$8, 85, 8, 1988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(85:34) ",
    		ctx
    	});

    	return block;
    }

    // (83:4) {#if error !== void 0}
    function create_if_block$4(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Si è verificato un errore nel caricare il file";
    			attr_dev(span, "id", "message");
    			attr_dev(span, "class", "svelte-teeumb");
    			add_location(span, file$8, 83, 8, 1872);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(83:4) {#if error !== void 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let span;
    	let t1;
    	let i;
    	let t3;
    	let form;
    	let input0;
    	let br0;
    	let t4;
    	let input1;
    	let t5;
    	let input2;
    	let br1;
    	let t6;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*error*/ ctx[1] !== void 0) return create_if_block$4;
    		if (/*uploaded*/ ctx[2] !== void 0) return create_if_block_1$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Nuovo video";
    			t1 = space();
    			i = element("i");
    			i.textContent = "close";
    			t3 = space();
    			form = element("form");
    			input0 = element("input");
    			br0 = element("br");
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			input2 = element("input");
    			br1 = element("br");
    			t6 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "svelte-teeumb");
    			add_location(span, file$8, 72, 4, 1471);
    			attr_dev(i, "class", "material-icons svelte-teeumb");
    			add_location(i, file$8, 73, 4, 1500);
    			attr_dev(input0, "id", "title");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "title");
    			attr_dev(input0, "placeholder", "Titolo");
    			input0.required = true;
    			add_location(input0, file$8, 79, 4, 1654);
    			add_location(br0, file$8, 79, 78, 1728);
    			attr_dev(input1, "type", "file");
    			attr_dev(input1, "name", "image");
    			input1.required = true;
    			add_location(input1, file$8, 80, 4, 1737);
    			attr_dev(input2, "type", "submit");
    			input2.value = "Carica";
    			add_location(input2, file$8, 81, 4, 1795);
    			add_location(br1, file$8, 81, 41, 1832);
    			add_location(form, file$8, 74, 4, 1540);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, span, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, i, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, input0);
    			append_dev(form, br0);
    			append_dev(form, t4);
    			append_dev(form, input1);
    			append_dev(form, t5);
    			append_dev(form, input2);
    			append_dev(form, br1);
    			append_dev(form, t6);
    			if (if_block) if_block.m(form, null);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input1, "change", /*input1_change_handler*/ ctx[6]),
    				listen_dev(form, "submit", /*submit_handler*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(form, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(form);

    			if (if_block) {
    				if_block.d();
    			}

    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let files;
    	let title;
    	let thumbnailUrl;
    	let error;
    	let uploaded;

    	async function upload() {
    		const formData = new FormData();
    		title = document.getElementById("title").value;
    		thumbnailUrl = prompt("Scrivi il link dell'immagine");
    		if (thumbnailUrl == null) return;
    		formData.append("title", title);
    		formData.append("thumbnailUrl", thumbnailUrl);
    		formData.append("video", files[0]);
    		console.log(files[0]);

    		const res = await fetch("/api/upload/video", {
    			credentials: "include",
    			method: "POST",
    			body: formData
    		});

    		const json = await res.json();
    		console.log(json);

    		if (!json.uploaded) {
    			$$invalidate(1, error = json.error);
    			return;
    		}

    		$$invalidate(2, uploaded = json);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<UploadVideo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("UploadVideo", $$slots, []);

    	function input1_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	const submit_handler = ev => {
    		ev.preventDefault();
    		ev.stopPropagation();
    		upload();
    	};

    	$$self.$capture_state = () => ({
    		files,
    		title,
    		thumbnailUrl,
    		error,
    		uploaded,
    		upload
    	});

    	$$self.$inject_state = $$props => {
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    		if ("title" in $$props) title = $$props.title;
    		if ("thumbnailUrl" in $$props) thumbnailUrl = $$props.thumbnailUrl;
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    		if ("uploaded" in $$props) $$invalidate(2, uploaded = $$props.uploaded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		files,
    		error,
    		uploaded,
    		upload,
    		title,
    		thumbnailUrl,
    		input1_change_handler,
    		submit_handler
    	];
    }

    class UploadVideo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UploadVideo",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.22.2 */

    // (10:0) <Router>
    function create_default_slot(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let current;

    	const route0 = new Route({
    			props: { path: "/", component: Home },
    			$$inline: true
    		});

    	const route1 = new Route({
    			props: { path: "/login", component: Login },
    			$$inline: true
    		});

    	const route2 = new Route({
    			props: { path: "/new", component: New },
    			$$inline: true
    		});

    	const route3 = new Route({
    			props: {
    				path: "/upload/video",
    				component: UploadVideo
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route0.$$.fragment);
    			t0 = space();
    			create_component(route1.$$.fragment);
    			t1 = space();
    			create_component(route2.$$.fragment);
    			t2 = space();
    			create_component(route3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(route1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(route2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(route3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(route1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(route2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(route3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(10:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current;

    	const router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Router,
    		Route,
    		Home,
    		Login,
    		New,
    		UploadVideo
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
