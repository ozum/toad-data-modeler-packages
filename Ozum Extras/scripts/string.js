var RE = {
    spacesAtBeginning: /^(\s|(\r?\n))+/,
    spacesAtEnd: /(\s|(\r?\n))+$/,
    emptyLinesAtBeginning: /^(\s*(\r?\n))+/,
    emptyLinesAtEnd: /((\r?\n)\s*)+$/,
    guid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
};

/**
 * Repeats given string in given quantity.
 *
 * @param {string} string is the string to repeat.
 * @param {number} quantity is the quantity to repeat.
 * @returns {string} Repeated string.
 *
 * @example
 * repeat("a", 3); // "aaa"
 */
function repeat(string, quantity) {
  var result = "";
  for (var i = 0; i < quantity || 0; i++) result += string;
  return result;
}

/**
 * Removes spaces from beginning and end of the string.
 *
 * @param {string} string is the string spaces from.
 * @param {Object} options
 * @param {boolean} [options.emptyLinesOnly = false] Trim only empty lines only.
 * @returns {string} trimmed string.
 *
 * @example
 * trim("   abc   "); // "abc"
 */
function trim(string, options) {
  options = object.assign(options, { emptyLinesOnly: false });
  var reBeginning = options.emptyLinesOnly
    ? RE.emptyLinesAtBeginning
    : RE.spacesAtBeginning;
  var reEnd = options.emptyLinesOnly ? RE.emptyLinesAtEnd : RE.spacesAtEnd;
  return typeof string === "string"
    ? string.replace(reBeginning, "").replace(reEnd, "")
    : string;
}

/**
 * Removes single or double quotes from given identifier.
 *
 * @param {string} string is the identifier to remove quotes from.
 * @returns {string} unquoted identifier.
 *
 * @example
 * unquote('"Member"'); // 'Member'
 * unquote("'Member'"); // 'Member'
 */
function unquote(string) {
  return string.replace(/^['"]|['"]$/g, "");
}

/**
 * Converts line endings to Windows format.
 *
 * @param {string} string is the string to convert
 * @returns {string} string with Windows format line ending.
 */
function convertLineEndingsToWin(string) {
  return typeof string === "string" ? string.replace(/\r?\n/g, "\r\n") : string;
}

/**
 * Validates whether the given value is a RFC 4122 GUID/UUID string.
 *
 * @param {string} value is the candidate string to check.
 * @returns {boolean} true when value matches the canonical 8-4-4-4-12 hexadecimal format.
 *
 * @example
 * validateGuid("123e4567-e89b-12d3-a456-426614174000"); // true
 */
function validateGuid(value) {
  return typeof value === "string" ? RE.guid.test(value) : false;
}

