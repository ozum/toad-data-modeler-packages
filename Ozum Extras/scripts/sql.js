/**
 * Removes double quotes from given identifier.
 *
 * @param {string} identifier is the identifier to remove quotes from.
 * @returns {string} unquoted identifier.
 *
 * @example
 * unquoteIdentifier('"Member"'); // 'Member'
 */
function unquoteIdentifier(identifier) {
  return identifier.replace(/^"|"$/g, "");
}

/**
 * Returns schema and name from given full name as an object.
 *
 * @param {string} fullName is the string to parse.
 * @param {object} options
 * @param {boolean} [options.unquote = true] is whether to remove quotes around names.
 * @returns {{ schema: string, name: string, fullName: string }} parsed object.
 *
 * @example
 * parseFullName('public."Member"'); // { schema: "public", name: "Member", fullName: "public.Member" }
 * parseFullName('public."Member"', { unquote: false }); // { schema: "public", name: '"Member"', fullName: 'public."Member"' }
 */
function parseFullName(fullName, options) {
  options = object.assign(options, { unquote: true });
  var parts = fullName.split(".");
  parts[0] = options.unquote ? unquoteIdentifier(parts[0]) : parts[0];
  if (parts.length > 1)
    parts[1] = options.unquote ? unquoteIdentifier(parts[1]) : parts[1];

  return parts.length === 1
    ? { name: parts[0], fullName: parts[0] }
    : { schema: parts[0], name: parts[1], fullName: parts[0] + "." + parts[1] };
}
