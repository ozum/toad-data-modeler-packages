/**
 * Returns the index of the first occurrence of a value in an array.
 * Mirrors Array.prototype.indexOf semantics but works in TDM's JScript host.
 *
 * @param {Array}  array          - Collection to search.
 * @param {*}      searchElement  - Value to locate in the array.
 * @param {number} [fromIndex=0]  - Starting index; negatives offset from the end.
 *
 * @returns {number} Zero-based index or -1 when the value is missing.
 *
 * @example
 * // returns 2
 * indexOf(['a', 'b', 'c'], 'c');
 */
function indexOf(array, searchElement, fromIndex) {
  var start = fromIndex < 0 ? array.length + fromIndex : fromIndex;
  for (var i = start || 0; i < array.length; i++)
    if (array[i] === searchElement) return i;

  return -1;
}

/**
 * Creates a new array with elements that pass the predicate test.
 * Mirrors Array.prototype.filter so legacy JScript macros can use the same API.
 *
 * @param {Array} array            - Source collection to iterate.
 * @param {Function} predicate     - Callback invoked as predicate(element, index, array).
 * @param {*} [thisArg]            - Optional value used as `this` inside the predicate.
 * @returns {Array}                - New array containing items where predicate returned truthy.
 *
 * @example
 * filter([1, 2, 3], function (value) { return value > 1; }); // [2, 3]
 */
function filter(array, predicate, thisArg) {
  var result = [];
  if (!array || typeof predicate !== "function") return result;
  for (var i = 0; i < array.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(array, i)) continue;
    if (predicate.call(thisArg, array[i], i, array)) result.push(array[i]);
  }
  return result;
}

/**
 * Executes a provided function once for each array element.
 * Mirrors Array.prototype.forEach so macros can avoid manual index loops.
 *
 * @param {Array} array            - Array to iterate.
 * @param {Function} callback      - Invoked as callback(element, index, array) per item.
 * @param {*} [thisArg]            - Optional value used as `this` inside the callback.
 */
function forEach(array, callback, thisArg) {
  if (!array || typeof callback !== "function") return;
  for (var i = 0; i < array.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(array, i)) continue;
    callback.call(thisArg, array[i], i, array);
  }
}


