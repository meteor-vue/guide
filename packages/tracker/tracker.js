import Vue from 'vue';

/////////////////////////////////////////////////////
// Package docs at http://docs.meteor.com/#tracker //
/////////////////////////////////////////////////////

/**
 * @namespace Tracker
 * @summary The namespace for Tracker-related methods.
 */
Tracker = {};

// http://docs.meteor.com/#tracker_active

/**
 * @summary True if there is a current computation, meaning that dependencies on reactive data sources will be tracked and potentially cause the current computation to be rerun.
 * @locus Client
 * @type {Boolean}
 */
Object.defineProperty(Tracker, 'active', {
  enumerable: true,
  configurable: true,
  get: function () {
    return !!Vue.util.Dep.target;
  }
});

// http://docs.meteor.com/#tracker_currentcomputation

/**
 * @summary The current computation, or `null` if there isn't one.  The current computation is the [`Tracker.Computation`](#tracker_computation) object created by the innermost active call to `Tracker.autorun`, and it's the computation that gains dependencies when reactive data sources are accessed.
 * @locus Client
 * @type {Tracker.Computation}
 */
Object.defineProperty(Tracker, 'currentComputation', {
  enumerable: true,
  configurable: true,
  get: function () {
    if (!Vue.util.Dep.target) {
      return null;
    }

    if (!Vue.util.Dep.target._computation) {
      // Vue.util.Dep.target._computation is set by the constructor.
      new Tracker.Computation(null, null, Vue.util.Dep.target, privateObject);
    }

    return Vue.util.Dep.target._computation;
  }
});

// `true` if the `_throwFirstError` option was passed in to the call
// to Tracker.flush that we are in. When set, throw rather than log the
// first error encountered while flushing.
var throwFirstError = false;

var _debugFunc = function () {
  // We want this code to work without Meteor, and also without
  // "console" (which is technically non-standard and may be missing
  // on some browser we come across, like it was on IE 7).
  //
  // Lazy evaluation because `Meteor` does not exist right away.(??)
  return (typeof Meteor !== "undefined" ? Meteor._debug :
          ((typeof console !== "undefined") && console.error ?
           function () { console.error.apply(console, arguments); } :
           function () {}));
};

var _maybeSuppressMoreLogs = function (messagesLength) {
  // Sometimes when running tests, we intentionally suppress logs on expected
  // printed errors. Since the current implementation of _throwOrLog can log
  // multiple separate log messages, suppress all of them if at least one suppress
  // is expected as we still want them to count as one.
  if (typeof Meteor !== "undefined") {
    if (Meteor._suppressed_log_expected()) {
      Meteor._suppress_log(messagesLength - 1);
    }
  }
};

var _throwOrLog = function (from, e) {
  if (throwFirstError) {
    throwFirstError = false;
    throw e;
  } else {
    var printArgs = ["Exception from Tracker " + from + " function:"];
    if (e.stack && e.message && e.name) {
      var idx = e.stack.indexOf(e.message);
      if (idx < 0 || idx > e.name.length + 2) { // check for "Error: "
        // message is not part of the stack
        var message = e.name + ": " + e.message;
        printArgs.push(message);
      }
    }
    printArgs.push(e.stack);
    _maybeSuppressMoreLogs(printArgs.length);

    for (var i = 0; i < printArgs.length; i++) {
      _debugFunc()(printArgs[i]);
    }
  }
};

// Takes a function `f`, and wraps it in a `Meteor._noYieldsAllowed`
// block if we are running on the server. On the client, returns the
// original function (since `Meteor._noYieldsAllowed` is a
// no-op). This has the benefit of not adding an unnecessary stack
// frame on the client.
var withNoYieldsAllowed = function (f) {
  if ((typeof Meteor === 'undefined') || Meteor.isClient) {
    return f;
  } else {
    return function () {
      var args = arguments;
      Meteor._noYieldsAllowed(function () {
        f.apply(null, args);
      });
    };
  }
};

// Tracker.Computation constructor is private, so we are using this object as a guard.
// External code cannot access this, and will not be able to directly construct a
// Tracker.Computation instance.
var privateObject = {};

//
// http://docs.meteor.com/#tracker_computation

/**
 * @summary A Computation object represents code that is repeatedly rerun
 * in response to
 * reactive data changes. Computations don't have return values; they just
 * perform actions, such as rerendering a template on the screen. Computations
 * are created using Tracker.autorun. Use stop to prevent further rerunning of a
 * computation.
 * @instancename computation
 */
Tracker.Computation = function (f, onError, watcher, _private) {
  if (_private !== privateObject)
    throw new Error(
      "Tracker.Computation constructor is private; use Tracker.autorun");

  var self = this;

  // http://docs.meteor.com/#computation_stopped

  /**
   * @summary True if this computation has been stopped.
   * @locus Client
   * @memberOf Tracker.Computation
   * @instance
   * @name  stopped
   */
  Object.defineProperty(self, 'stopped', {
    enumerable: true,
    configurable: true,
    get: function () {
      return !self._vueWatcher.active;
    }
  });

  // http://docs.meteor.com/#computation_invalidated

  /**
   * @summary True if this computation has been invalidated (and not yet rerun), or if it has been stopped.
   * @locus Client
   * @memberOf Tracker.Computation
   * @instance
   * @name  invalidated
   * @type {Boolean}
   */
  self.invalidated = false;

  // http://docs.meteor.com/#computation_firstrun

  /**
   * @summary True during the initial run of the computation at the time `Tracker.autorun` is called, and false on subsequent reruns and at other times.
   * @locus Client
   * @memberOf Tracker.Computation
   * @instance
   * @name  firstRun
   * @type {Boolean}
   */
  self._firstRun = true;
  Object.defineProperty(self, 'firstRun', {
    enumerable: true,
    configurable: true,
    get: function () {
      if (self._pureWatcher) {
        throw new Error("Not available for pure watchers.");
      }

      return self._firstRun;
    }
  });

  Object.defineProperty(self, '_id', {
    enumerable: true,
    configurable: true,
    get: function () {
      return self._vueWatcher.id;
    }
  });

  self._onInvalidateCallbacks = [];
  self._onStopCallbacks = [];
  self._onError = onError;
  self._recomputing = false;

  if (watcher) {
    if (watcher._computation) {
      // Should never happen.
      throw new Error("Duplicate computation for the same pure watcher.");
    }

    self._vueWatcher = watcher;
    watcher._computation = self;

    // This computation wrapping an existing (pure) watcher.
    self._pureWatcher = true;
  }
  else {
    f = withNoYieldsAllowed(f);

    var vm = (Vue.util.Dep.target && Vue.util.Dep.target.vm) || {_watchers: [], name: 'Tracker'};
    self._vueWatcher = new Vue.util.Watcher(vm, function (vm) {
      f(self);
    }, function (value, oldValue) {
      // Not really used.
    }, {
      // We do not set deep so that callback is not really run.
      deep: false,
      // So that errors are not handled by the watcher.
      user: false,
      // We start lazy, so that it does not compute the value automatically on creation.
      // We change it later on from outside.
      lazy: true
    });
    self._vueWatcher._computation = self;

    // This computation has been constructed through Tracker.autorun.
    self._pureWatcher = false;
  }

  var originalGetter = self._vueWatcher.getter;
  self._vueWatcher.getter = function () {
    if (self._pureWatcher || self._firstRun) {
      self.invalidated = false;
      return originalGetter.apply(this, arguments);
    }
    else {
      self._recomputing = true;
      try {
        if (self._needsRecompute()) {
          try {
            self.invalidated = false;
            return originalGetter.apply(this, arguments);
          } catch (e) {
            if (self._onError) {
              self._onError(e);
            } else {
              _throwOrLog("recompute", e);
            }
          }
        }
      } finally {
        self._recomputing = false;
      }
    }
  };

  var originalTeardown = self._vueWatcher.teardown;
  self._vueWatcher.teardown = function () {
    if (!self.stopped) {
      originalTeardown.call(this);
      self.invalidate();
      for(var i = 0, f; f = self._onStopCallbacks[i]; i++) {
        Tracker.nonreactive(function () {
          withNoYieldsAllowed(f)(self);
        });
      }
      self._onStopCallbacks = [];
    }
  };

  var originalUpdate = self._vueWatcher.update;
  self._vueWatcher.update = function () {
    if (!self.invalidated) {
      if (self._pureWatcher || !self.stopped) {
        originalUpdate.call(this);
      }

      self.invalidated = true;

      // callbacks can't add callbacks, because
      // self.invalidated === true.
      for(var i = 0, f; f = self._onInvalidateCallbacks[i]; i++) {
        Tracker.nonreactive(function () {
          withNoYieldsAllowed(f)(self);
        });
      }
      self._onInvalidateCallbacks = [];
    }
    else if (self._pureWatcher) {
      originalUpdate.call(this);
    }
  };

  if (!self._pureWatcher) {
    // We started lazy to not run computation before we
    // prepared everything, now we turn it off.
    self._vueWatcher.lazy = false;
    self._vueWatcher.dirty = false;

    // Run computation for the first time.
    var errored = true;
    try {
      self._vueWatcher.run();
      errored = false;
    }
    finally {
      self._firstRun = false;
      if (errored) {
        self.stop();
      }
    }
  }
};

// http://docs.meteor.com/#computation_oninvalidate

/**
 * @summary Registers `callback` to run when this computation is next invalidated, or runs it immediately if the computation is already invalidated.  The callback is run exactly once and not upon future invalidations unless `onInvalidate` is called again after the computation becomes valid again.
 * @locus Client
 * @param {Function} callback Function to be called on invalidation. Receives one argument, the computation that was invalidated.
 */
Tracker.Computation.prototype.onInvalidate = function (f) {
  var self = this;

  if (typeof f !== 'function')
    throw new Error("onInvalidate requires a function");

  if (self.invalidated) {
    Tracker.nonreactive(function () {
      withNoYieldsAllowed(f)(self);
    });
  } else {
    self._onInvalidateCallbacks.push(f);
  }
};

/**
 * @summary Registers `callback` to run when this computation is stopped, or runs it immediately if the computation is already stopped.  The callback is run after any `onInvalidate` callbacks.
 * @locus Client
 * @param {Function} callback Function to be called on stop. Receives one argument, the computation that was stopped.
 */
Tracker.Computation.prototype.onStop = function (f) {
  var self = this;

  if (typeof f !== 'function')
    throw new Error("onStop requires a function");

  if (self.stopped) {
    Tracker.nonreactive(function () {
      withNoYieldsAllowed(f)(self);
    });
  } else {
    self._onStopCallbacks.push(f);
  }
};

// http://docs.meteor.com/#computation_invalidate

/**
 * @summary Invalidates this computation so that it will be rerun.
 * @locus Client
 */
Tracker.Computation.prototype.invalidate = function () {
  var self = this;
  self._vueWatcher.update();
};

// http://docs.meteor.com/#computation_stop

/**
 * @summary Prevents this computation from rerunning.
 * @locus Client
 */
Tracker.Computation.prototype.stop = function () {
  var self = this;
  self._vueWatcher.teardown();
};

Tracker.Computation.prototype._needsRecompute = function () {
  var self = this;
  return self.invalidated && !self.stopped;
};

/**
 * @summary Process the reactive updates for this computation immediately
 * and ensure that the computation is rerun. The computation is rerun only
 * if it is invalidated.
 * @locus Client
 */
Tracker.Computation.prototype.flush = function () {
  var self = this;

  if (self._recomputing)
    return;

  self._vueWatcher.run();
};

/**
 * @summary Causes the function inside this computation to run and
 * synchronously process all reactive updtes.
 * @locus Client
 */
Tracker.Computation.prototype.run = function () {
  var self = this;
  self.invalidate();
  self.flush();
};

//
// http://docs.meteor.com/#tracker_dependency

/**
 * @summary A Dependency represents an atomic unit of reactive data that a
 * computation might depend on. Reactive data sources such as Session or
 * Minimongo internally create different Dependency objects for different
 * pieces of data, each of which may be depended on by multiple computations.
 * When the data changes, the computations are invalidated.
 * @class
 * @instanceName dependency
 */
Tracker.Dependency = function () {
  this._vueDep = new Vue.util.Dep();
};

// http://docs.meteor.com/#dependency_depend
//
// Adds `computation` to this set if it is not already
// present.  Returns true if `computation` is a new member of the set.
// If no argument, defaults to currentComputation, or does nothing
// if there is no currentComputation.

/**
 * @summary Declares that the current computation (or `fromComputation` if given) depends on `dependency`.  The computation will be invalidated the next time `dependency` changes.

If there is no current computation and `depend()` is called with no arguments, it does nothing and returns false.

Returns true if the computation is a new dependent of `dependency` rather than an existing one.
 * @locus Client
 * @param {Tracker.Computation} [fromComputation] An optional computation declared to depend on `dependency` instead of the current computation.
 * @returns {Boolean}
 */
Tracker.Dependency.prototype.depend = function (computation) {
  if (! computation) {
    if (! Tracker.active)
      return false;

    computation = Tracker.currentComputation;
  }
  var self = this;
  var existing = computation._vueWatcher.newDepIds.has(self._vueDep.id) || computation._vueWatcher.depIds.has(self._vueDep.id);
  computation._vueWatcher.addDep(self._vueDep);
  return existing;
};

// http://docs.meteor.com/#dependency_changed

/**
 * @summary Invalidate all dependent computations immediately and remove them as dependents.
 * @locus Client
 */
Tracker.Dependency.prototype.changed = function () {
  var self = this;
  self._vueDep.notify()
};

// http://docs.meteor.com/#dependency_hasdependents

/**
 * @summary True if this Dependency has one or more dependent Computations, which would be invalidated if this Dependency were to change.
 * @locus Client
 * @returns {Boolean}
 */
Tracker.Dependency.prototype.hasDependents = function () {
  var self = this;
  return !!self._vueDep.subs.length;
};

// http://docs.meteor.com/#tracker_flush

/**
 * @summary Process all reactive updates immediately and ensure that all invalidated computations are rerun.
 * @locus Client
 */
Tracker.flush = function (options) {
  throwFirstError = options && options._throwFirstError;
  try {
    // Tracker flush does not limit the number of updates, but watcher does.
    // So we set the limit to 10000 which is infinity for most practical purposes.
    Vue.util.forceFlush((options && options._maxUpdateCount) || 10000);
  }
  finally {
    throwFirstError = false;
  }
};

// http://docs.meteor.com/#tracker_autorun
//
// Run f(). Record its dependencies. Rerun it whenever the
// dependencies change.
//
// Returns a new Computation, which is also passed to f.
//
// Links the computation to the current computation
// so that it is stopped if the current computation is invalidated.

/**
 * @callback Tracker.ComputationFunction
 * @param {Tracker.Computation}
 */
/**
 * @summary Run a function now and rerun it later whenever its dependencies
 * change. Returns a Computation object that can be used to stop or observe the
 * rerunning.
 * @locus Client
 * @param {Tracker.ComputationFunction} runFunc The function to run. It receives
 * one argument: the Computation object that will be returned.
 * @param {Object} [options]
 * @param {Function} options.onError Optional. The function to run when an error
 * happens in the Computation. The only argument it receives is the Error
 * thrown. Defaults to the error being logged to the console.
 * @returns {Tracker.Computation}
 */
Tracker.autorun = function (f, options) {
  if (typeof f !== 'function')
    throw new Error('Tracker.autorun requires a function argument');

  options = options || {};

  var c = new Tracker.Computation(f, options.onError, null, privateObject);

  if (Tracker.active)
    Tracker.onInvalidate(function () {
      c.stop();
    });

  return c;
};

// http://docs.meteor.com/#tracker_nonreactive
//
// Run `f` with no current computation, returning the return value
// of `f`.  Used to turn off reactivity for the duration of `f`,
// so that reactive data sources accessed by `f` will not result in any
// computations being invalidated.

/**
 * @summary Run a function without tracking dependencies.
 * @locus Client
 * @param {Function} func A function to call immediately.
 */
Tracker.nonreactive = function (f) {
  var previous = Vue.util.Dep.target;
  Vue.util.Dep.target = null;
  try {
    return f();
  }
  finally {
    Vue.util.Dep.target = previous;
  }
};

// http://docs.meteor.com/#tracker_oninvalidate

/**
 * @summary Registers a new [`onInvalidate`](#computation_oninvalidate) callback on the current computation (which must exist), to be called immediately when the current computation is invalidated or stopped.
 * @locus Client
 * @param {Function} callback A callback function that will be invoked as `func(c)`, where `c` is the computation on which the callback is registered.
 */
Tracker.onInvalidate = function (f) {
  if (!Tracker.active) {
    throw new Error("Tracker.onInvalidate requires a currentComputation");
  }

  Tracker.currentComputation.onInvalidate(f);
};

// http://docs.meteor.com/#tracker_afterflush

/**
 * @summary Schedules a function to be called during the next flush, or later in the current flush if one is in progress, after all invalidated computations have been rerun.  The function will be run once and not on subsequent flushes unless `afterFlush` is called again.
 * @locus Client
 * @param {Function} callback A function to call at flush time.
 */
Tracker.afterFlush = function (f) {
  Vue.util.afterFlush(function () {
    try {
      f();
    } catch (e) {
      _throwOrLog("afterFlush", e);
    }
  });
};
