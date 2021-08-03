const msg = require('fancy-log')

/**
 * Log changes with timestamp for easier debugging
 *
 * @param {String} message - Message to display
 * @param {Boolean} debug - If `true` display message
 * @returns {Void} Displays message
 */
const log = (message, debug = false) => {
  if (debug) { msg(message) }
}

/**
 * Checks if statement is falsy
 *
 * @param { Any } statement - Checks any statement for falsy
 * @returns { Boolean }
 */

const isFalsy = (statement = true) => {
  if (
    !statement ||
    statement === null ||
    typeof statement === 'undefined' ||
		statement === 0 ||
		statement === ''
  ) {
    return true
  }

  return false
}

module.exports = {
  log,
  isFalsy,
}
