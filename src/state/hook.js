const { STATE } = require('red/internals/constants');
const { useSyncExternalStore } = require('react');

/**
 * A simple store that consumes an object from our red/state
 *
 * @param {Object} selection Object we want to trigger on.
 * @returns {Store} Store.
 * @public
 */
function useSelectiveState(selection) {
  const store = selection[STATE];
  if (!store) throw new Error(`The selection was not an instance of red/state`);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

module.exports = {
  useSelectiveState
};
