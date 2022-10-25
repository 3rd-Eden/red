const { STATE } = require('red/internals/constants');
const typecheck = require('red/internals/typeof');
const clone = require('red/internals/clone');

/**
 *
 */
class State {
  constructor(state = {}) {
    this.listeners = new Set();
    this.changes = false;
    this.snapshot = {};

    //
    // Note order of assignment matters here. As modified will be passed to
    // to other sub proxies created, we want to make sure it's bound before
    // we finally create the initial data structure.
    //
    this.modified = this.modified.bind(this);
    this.state = this.create(state);
  }

  /**
   * A modification has been made to the state.
   *
   * @private
   */
  modified() {
    this.changes = true;
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Creates a proxy that will track values and emit change listeners. It will
   * automatically update objects/arrays to be trackable as well.
   *
   * @param {Object} [state={}] Initial state.
   * @returns {Object} Interactable state.
   * @public
   */
  create(state = {}) {
    const proxy = new Proxy({}, {
      get: (target, key, receiver) => {
        if (key === STATE) return this;

        return Reflect.get(target, key, receiver);
      },

      deleteProperty: (target, key) => {
        const current = Reflect.get(target, key);
        const deleted = Reflect.deleteProperty(target, key);

        if (current && current[STATE]) current[STATE].unsubscribe(this.modified);
        if (deleted) this.modified();

        return deleted;
      },

      set: (target, key, value, receiver) => {
        const current = Reflect.get(target, key, receiver);

        if (current === value) return true;
        if (current && current[STATE]) current[STATE].unsubscribe(this.modified);

        const type = typecheck(value);

        if ('object' === type || 'array' === type) {
          const tracker = new State(value);

          tracker.subscribe(this.modified);
          value = tracker.state;
        }

        Reflect.set(target, key, value, receiver);
        this.modified();

        return true;
      }
    });

    Object.assign(proxy, state);
    return proxy;
  }

  /**
   * Subscribe to changes.
   *
   * @param {Function} fn Function that listens to state changes.
   * @returns {Function} Unsubscribe
   * @public
   */
  subscribe(fn) {
    this.listeners.add(fn);
    return this.unsubscribe.bind(this, fn);
  }

  /**
   * Removes a pre-assigned listener.
   *
   * @param {Function} fn Function that listens to state changes.
   * @public
   */
  unsubscribe(fn) {
    this.listeners.delete(fn);
  }

  /**
   * Retrieve the snapshot of our current state.
   *
   * @returns {Object} Snapshot of current state.
   * @public
   */
  getSnapshot() {
    if (!this.changes) return this.snapshot;

    this.snapshot = clone(this.state);
    this.changes = false;

    return this.snapshot;
  }
}

//
// Expose for consumption.
//
module.exports = new State();
module.exports.State = State;
