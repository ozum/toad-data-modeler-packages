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
