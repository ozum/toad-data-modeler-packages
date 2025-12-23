/**
 * Logs given simple variable's or object's or array's properties into logging window.
 *
 * @param {*} target is the variable to inspect.
 * @param {number} _level is the level in recursion.
 * @param {string} _parentKey is the key from parent.
 * @returns {void}
 */
function inspect(target, _level, _parentKey) {
  var log = toad.getLog()
  _level = _level || 0;

  if (_level > 0 && _parentKey !== undefined)
    log.information(string.repeat(" |-- ", _level - 1) + "[" + _parentKey + "]: ");

  for (var key in target)
    typeof target[key] === "object"
      ? inspect(target[key], _level + 1, key)
      : log.information(
          string.repeat(" |-- ", _level) + "[" + key + "]: " + target[key]
        );
}

/**
 * Assign attributes from defaults object into target object if it is undefined in target object.
 *
 * @param {object} target is the object assign default values to.
 * @param {object} defaults is the object containing default values.
 * @returns {object} target object including default values.
 *
 * @example
 * assign({ name: "John", surname: "Doe" }, { name: "Jane", level: 10 }); // { name: "John", surname: "Doe", level: 10 }
 */
function assign(target, defaults) {
  target = target || defaults;

  for (var key in defaults)
    target[key] = target[key] === undefined ? defaults[key] : target[key];

  return target;
}

/**
 * Returns an array of an object's own enumerable property names.
 * Provides an Object.keys equivalent for JScript environments.
 *
 * @param {object} target - Source object to inspect.
 * @returns {string[]}    - List of keys owned directly by the object.
 *
 * @example
 * var keys = getKeys({ a: 1, b: 2 });
 * // keys.length === 2
 */
function keys(target) {
  var result = [];
  if (!target) return result;
  for (var key in target)
    if (Object.prototype.hasOwnProperty.call(target, key)) result.push(key);
  return result;
}

