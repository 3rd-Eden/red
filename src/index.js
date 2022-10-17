const register = require('red/register');

/**
 * Example component for testing.
 *
 * @param {Object} props Component properties.
 * @returns {React.Component} Our block.
 * @public
 */
function Block(props) {
  return <div>{ props.children }</div>
}

//
// Expose for consumption.
//
module.exports = register({ Block });
