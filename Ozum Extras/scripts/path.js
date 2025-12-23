/**
 * Gets the directory of a path.
 *
 * @param {string} filePath is the path to get directory of.
 * @returns {string} Directory of the given path.
 *
 * @example
 * dirname("a/b/c.txt"); // "a/b"
 */
function dirname(filePath) {
  return filePath.substring(0, filePath.lastIndexOf("\\") + 1);
}

/**
 * Gets the last portion of a path.
 *
 * @param {string} filePath is the bath to get base name of.
 * @param {string} [suffix] suffix to remove from the base name.
 * @returns {string} last portion of the path.
 *
 * @example
 * basename("a/b/c.txt"); // "c.txt"
 * basename("a/b/c.txt", ".txt"); // "c"
 */
function basename(filePath, suffix) {
  return filePath
    .substring(filePath.lastIndexOf("\\") + 1)
    .replace(new RegExp(suffix + "$"), "");
}

/**
 * Gets the extension of the path, from the last occurrence
 * of the . (period) character to end of string in the last portion of the path.
 *
 * @param {string} filePath is the path to get extension of.
 * @returns {string} extension.
 *
 * @example
 * extname("a/b/c.txt"); // ".txt"
 */
function extname(filePath) {
  return filePath.substring(filePath.lastIndexOf(".") + 1);
}

/**
 * Returns an object whose properties represent significant elements of the path.
 *
 * @param {string} filePath is the path to get extension of.
 * @returns {Object} significant elements of the path.
 *
 * @example
 * parse("/home/user/dir/file.txt");
 * {
 *   dir: "/home/user/dir",
 *   base: "file.txt",
 *   ext: ".txt",
 *   name: "file"
 * }
 */
function parse(filePath) {
  var extension = extname(filePath);
  return {
    dir: dirname(filePath),
    base: baseName(filePath),
    ext: extension,
    name: baseName(filePath, extension)
  };
}

/**
 * Gets the relative path from one absolute path to another (Windows-style separators).
 * Falls back to the target path unchanged when the two locations live on different drives.
 *
 * @param {string} fromPath - Starting absolute path.
 * @param {string} toPath   - Destination absolute path.
 * @returns {string}        - Relative path (e.g., "..\\scripts\\file.sql") or the destination when no relative path exists.
 *
 * @example
 * relative("C:\\models\\db-lib\\functions", "C:\\models\\scripts\\macro.js"); // "..\\scripts\\macro.js"
 */
function relative(fromPath, toPath) {
  if (!fromPath || !toPath) return "";

  var from = _normalizePath(fromPath);
  var to = _normalizePath(toPath);

  var fromInfo = _splitPath(from);
  var toInfo = _splitPath(to);

  // Different drives or UNC roots cannot be expressed relatively.
  if (fromInfo.root.toLowerCase() !== toInfo.root.toLowerCase()) return to;

  var commonLength = 0;
  var maxCommon = Math.min(fromInfo.parts.length, toInfo.parts.length);
  while (commonLength < maxCommon && fromInfo.parts[commonLength].toLowerCase() === toInfo.parts[commonLength].toLowerCase())
    commonLength += 1;

  var up = [];
  for (var i = commonLength; i < fromInfo.parts.length; i++) up.push("..");
  var down = toInfo.parts.slice(commonLength);
  var segments = up.concat(down);
  if (!segments.length) return ".";
  return segments.join("\\");
}

function _normalizePath(pathValue) {
  return (pathValue || "").replace(/\//g, "\\");
}

function _splitPath(value) {
  var match = value.match(/^([A-Za-z]:|\\\\[^\\]+\\[^\\]+)/);
  var root = match ? match[0] : "";
  var remainder = value.slice(root.length).replace(/^\\+|\\+$/g, "");
  var parts = remainder ? remainder.split(/\\+/) : [];
  return { root: root, parts: parts };
}
