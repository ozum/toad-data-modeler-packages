/**
 * Iterates over a COM list collection and invokes the callback with the current item,
 * zero-based index, and the original collection.
 *
 * @param {List} collection - COM collection exposed to Enumerator().
 * @param {function(*, number, List): void} callback - Receives (item, index, collection).
 *   item       - value returned by Enumerator.item().
 *   index      - zero-based position within the iteration.
 *   collection - original COM source passed to the helper.
 *
 * @example
 * // Iterate over files in a folder
 * var fs = new ActiveXObject("Scripting.FileSystemObject");
 * var folder = fs.GetFolder("C:\\MyProject");
 * forEach(folder.Files, function(file, index) {
 *     ShowInformation("File " + index + ": " + file.Name);
 * });
 */
function forEach(collection, callback) {
  for (var i = 0; i < collection.Count; i++) callback(collection.getObject(i), i, collection);
}


/**
 * Materializes a COM List collection into a plain JScript array.
 *
 * @param {List} collection - Enumerator-compatible COM collection (e.g., Folder.Files).
 * @returns {Array}         - New array containing a snapshot copy of each element.
 */
function toArray(collection) {
  var result = [];

  for (var i = 0; i < collection.Count; i++) result.push(collection.getObject(i));

  return result;
}

/**
 * Projects a COM List collection into an object map using custom key/value pickers.
 *
 * @param {List} collection                 - Enumerator-friendly COM list.
 * @param {string|function(*): string} keySelector - Property name or callback returning the key.
 * @param {string|function(*): *} [valueSelector]  - Property name or callback for the stored value.
 *                                                   Defaults to the original item reference.
 * @returns {Object}                        - Plain object keyed by the selector result.
 *
 * @example
 * // Map Toad Data Modeler tables by their internal IDs
 * var tablesById = toObject(model.Entities, "Id");
 * var tablesById2 = toObject(model.Entities, function(table) { return table.Id; });
 * // tablesById["ENT_1"] === "Accounts"
 */
function toObject(collection, keySelector, valueSelector) {
  var result = {};
  for (var i = 0; i < collection.Count; i++) {
    var item = collection.getObject(i);
    var key = typeof keySelector === "string" ? item[keySelector] : keySelector(item);
    var value = typeof valueSelector === "string" ? item[valueSelector] : valueSelector ? valueSelector(item) : item;
    result[key] = value;
  }
  return result;
}
