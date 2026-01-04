// Constantsvar
var LANGUAGES = {
  sql: "sql",
  c: "c",
  internal: "internal",
  plpgsql: "plpgsql"
};

var OPTION_TERMINATORS = [
  "LANGUAGE",
  "IMMUTABLE",
  "STABLE",
  "VOLATILE",
  "STRICT",
  "RETURNS",
  "SECURITY",
  "COST",
  "ROWS",
  "PARALLEL",
  "WINDOW",
  "CALLED",
  "LEAKPROOF",
  "NOT",
  "SET",
  "AS",
  "TRANSFORM"
];

var SKIP = {
  guid: "ALL",
  asClause: "ALL",
  raw: "ALL",
  filePath: "ALL",
  fullName: "ALL",
  type: "ALL",
  schema: "ALL",
  returns: "PROCEDURE",
  volatility: "PROCEDURE",
  leakproof: "PROCEDURE",
  isStrict: "PROCEDURE",
  cost: "PROCEDURE",
  rows: "PROCEDURE",
  window: "PROCEDURE",
  parallel: "PROCEDURE"
};



function _updateFrom(item, parsed) {
  var model = toad.getModel();
  var schema =
    model.schemas.getObjectByName(parsed.schema) ||
    model.createNewObject(2024);

  schema.lock();
  item.lock();

  if (schema.name !== parsed.schema)
    schema.name = parsed.schema;

  item.schema = schema;
  item.generateSQLOnly = false;

  for (var key in parsed) {
    if (!(SKIP[key] === "ALL" || SKIP[key] === parsed.type)) {
      try {
        item[key] = parsed[key];
      } catch (e) {
        toad.getLog().error("Failed to set property '" + key + "' on item '" + item.fullName + "'");
      }
    }
  }

  item.unlock();
  schema.unlock();
}


function updateFrom(input) {
  var parsed = typeof input === "string" ? parse(input) : input
  var model = toad.getModel();
  var log = toad.getLog();

  // Create Item
  if (parsed.guid) {
    var collection = parsed.type === "FUNCTION" ? model.Functions : model.Procedures;
    try {
      var item = collection.getObjectById(parsed.guid);
    } catch (e) {

    }
  }
  if (!item)
           item = model.createNewObject(parsed.type === "FUNCTION" ? 2028 : 2015);

  _updateFrom(item, parsed);
  return item;
}



/**
 * Parses PostgreSQL CREATE FUNCTION/PROCEDURE statements into structured metadata.
 * Handles dollar-quoted bodies, single-quoted externals, options that appear before/after the body, and trailing COMMENT ON FUNCTION blocks.
 *
 * @param {string} functionSQL      - Raw SQL text that may include the CREATE statement and optional comment.
 * @param {string} filePath         - Absolute file path of the source SQL (used for diagnostics).
 * @returns {object|undefined}      - Structured info with the following keys when parsing succeeds:
 *   - beforeScript {string}  Leading text before CREATE.
 *   - raw {string}           Original function SQL (un-normalized).
 *   - afterScript {string}   Trailing text after COMMENT ON (if any).
 *   - type {"FUNCTION"|"PROCEDURE"} Object kind.
 *   - fullName/schema/name/caption {string} Derived identifiers.
 *   - argumentList {string}  Windows-line-ending argument list.
 *   - returns {string}       RETURNS clause payload.
 *   - language {string}      Normalized language (sql, c, plpgsql, etc.).
 *   - userDefinedLanguage {string|undefined} Original language when not recognized.
 *   - volatility {string}    IMMUTABLE/STABLE/VOLATILE.
 *   - isSecurityDefiner {boolean}
 *   - leakproof {boolean}
 *   - isStrict {boolean}
 *   - cost {string|undefined}
 *   - rows {string|undefined}
 *   - window {boolean}
 *   - parallel {string}
 *   - sql {string}           Body text stripped of delimiters.
 *   - asClause {string}      Raw AS literal.
 *   - filePath {string}
 *   - fromFile {boolean}
 *   - guid {string|undefined} Parsed `@GUID {96E5CCA4-851E-497B-809A-D94334716DD4}` marker inside body. (Including curly braces '{}')
 *   - comments {string|undefined} COMMENT ON payload when present.
 *
 * @example
 * parseFunctionSQL("CREATE OR REPLACE FUNCTION public.calculate(a int) RETURNS int AS $$ BEGIN ... $$ LANGUAGE plpgsql;");
 */
function parse(functionSQL, filePath) {
  if (!functionSQL) return undefined;

  var normalized = string.convertLineEndingsToWin(functionSQL);
  var createInfo = extractCreateStatement(normalized);
  if (!createInfo) return undefined;

  var commentInfo = _extractTrailingComment(normalized, createInfo.startIndex);
  var commentText = commentInfo ? commentInfo.comment : undefined;

  var definitionSection;
  var afterScript;
  if (commentInfo) {
    definitionSection = normalized.slice(
      createInfo.startIndex,
      commentInfo.commentIndex
    );
    afterScript = string.trim(commentInfo.after, { emptyLinesOnly: true });
  } else {
    var statementEndIndex = _findStatementEnd(normalized, createInfo.startIndex);
    if (statementEndIndex === -1) statementEndIndex = normalized.length;
    definitionSection = normalized.slice(
      createInfo.startIndex,
      statementEndIndex
    );
    afterScript = string.trim(
      normalized.slice(statementEndIndex),
      { emptyLinesOnly: true }
    );
  }

  var statement = definitionSection;
  var createTokenEnd = createInfo.afterKeywordIndex - createInfo.startIndex;
  var openParenIndex = _findTopLevelChar(statement, "(", createTokenEnd);
  if (openParenIndex === -1) return undefined;

  var nameSegment = string.trim(
    statement.slice(createTokenEnd, openParenIndex)
  );
  var parsedName = sql.parseFullName(nameSegment);
  var argsInfo = _extractBalancedParentheses(statement, openParenIndex);
  if (!argsInfo) return undefined;

  var bodyInfo = _locateBodyLiteral(statement, argsInfo.endIndex);
  if (!bodyInfo) return undefined;

  var optionsSegment =
    statement.slice(argsInfo.endIndex, bodyInfo.literalStart) +
    " " +
    statement.slice(bodyInfo.literalEnd);
  var optionSearch = _collapseWhitespace(optionsSegment);
  var optionUpper = _wrapWithSpaces(optionSearch.toUpperCase());

  var returnsClause = _extractClause(
    optionsSegment,
    "RETURNS",
    OPTION_TERMINATORS
  );
  var languageClause = _extractLanguage(optionsSegment);
  var costClause = _extractNumericOption(optionsSegment, "COST");
  var rowsClause = _extractNumericOption(optionsSegment, "ROWS");
  var parallelClause = _extractParallelOption(optionsSegment);

  var result = {};
  result.beforeScript = string.trim(
    normalized.slice(0, createInfo.startIndex),
    {
      emptyLinesOnly: true
    }
  );
  result.raw = functionSQL;
  result.afterScript = afterScript;
  result.type = createInfo.type;
  result.fullName = parsedName.fullName;
  result.schema = parsedName.schema;
  result.caption = parsedName.name;
  result.name = parsedName.name;
  result.argumentList = _formatArgumentList(argsInfo.content);
  result.returns = returnsClause || "";
  var languageValue = languageClause ? languageClause.replace(/"/g, "") : "";
  result.language = _resolveLanguage(languageValue);
  result.userDefinedLanguage =
    result.language === "user-defined" && languageValue
      ? languageValue
      : undefined;
  result.volatility = _containsWord(optionUpper, "IMMUTABLE")
    ? "IMMUTABLE"
    : _containsWord(optionUpper, "STABLE")
      ? "STABLE"
      : "VOLATILE";
  result.isSecurityDefiner = _containsPhrase(optionUpper, "SECURITY DEFINER");
  result.leakproof =
    _containsPhrase(optionUpper, "LEAKPROOF") &&
    !_containsPhrase(optionUpper, "NOT LEAKPROOF");
  result.isStrict =
    _containsWord(optionUpper, "STRICT") ||
    _containsPhrase(optionUpper, "RETURNS NULL ON NULL INPUT") ||
    _containsPhrase(optionUpper, "CALLED ON NULL INPUT");
  result.cost = costClause;
  result.rows = rowsClause;
  result.window = _containsWord(optionUpper, "WINDOW");
  result.parallel = parallelClause || "UNSAFE";
  result.sql = bodyInfo.bodyText;
  result.asClause = bodyInfo.literal;
  result.filePath = filePath;
  result.guid = extractGUID(functionSQL);
  result.comments = commentText;

  return result;
}

/**
 * Extracts the first `@GUID {....}` marker from a SQL body, preserving braces.
 * Returns `undefined` when the marker is missing or the input is falsy.
 *
 * @param {string} bodyText - Raw SQL text (e.g., CREATE FUNCTION block).
 * @returns {string|undefined} Canonical GUID with braces when present.
 *
 * @example
 *   extractGUID('BEGIN\n  -- @GUID {9968C379-A8C4-4D5A-9F23-4F79E7C3B5E9}\nEND;');
 *   // => "{9968C379-A8C4-4D5A-9F23-4F79E7C3B5E9}"
 */
function extractGUID(bodyText) {
  if (!bodyText) return undefined;
  var GUID_REGEX = /\@GUID\s*(\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\})/i;
  var match = GUID_REGEX.exec(bodyText);
  return match ? match[1] : undefined;
}


function extractCreateStatement(sql) {
  var pattern = /CREATE\s+(?:OR\s+REPLACE\s+)?(FUNCTION|PROCEDURE)\s+/i;
  var match = pattern.exec(sql);
  if (!match) return undefined;
  return {
    type: match[1].toUpperCase(),
    startIndex: match.index,
    afterKeywordIndex: match.index + match[0].length
  };
}

function _extractTrailingComment(sql, createIndex) {
  var commentRegex =
    /COMMENT\s+ON\s+(FUNCTION|PROCEDURE)[\s\S]+?IS\s+(\$[A-Za-z0-9_]*\$[\s\S]*?\$[A-Za-z0-9_]*\$|'(?:''|[^'])*')\s*;([\s\S]*)$/i;
  var match = commentRegex.exec(sql);
  if (!match || match.index <= createIndex) {
    return undefined;
  }
  return {
    commentIndex: match.index,
    comment: _unquoteCommentLiteral(match[2]),
    after: match[3]
  };
}

function _findStatementEnd(text, startIndex) {
  if (typeof startIndex !== "number" || startIndex < 0) return -1;
  var ctx = _createScanContext();
  for (var i = startIndex; i < text.length; i += 1) {
    ctx.advance(text, i);
    if (ctx.skipLength > 0) {
      i += ctx.skipLength - 1;
      ctx.skipLength = 0;
      continue;
    }
    if (ctx.isActive()) {
      continue;
    }
    if (text.charAt(i) === ";") {
      return i + 1;
    }
  }
  return -1;
}

function _unquoteCommentLiteral(literal) {
  if (!literal) return "";
  if (literal.charAt(0) === "$") {
    var tag = literal.match(/^\$[A-Za-z0-9_]*\$/)[0];
    return string.convertLineEndingsToWin(
      literal.substring(tag.length, literal.length - tag.length)
    );
  }
  return string.convertLineEndingsToWin(
    literal.substring(1, literal.length - 1).replace(/''/g, "'")
  );
}

function _findTopLevelChar(text, target, startIndex) {
  var ctx = _createScanContext();
  for (var i = startIndex; i < text.length; i += 1) {
    ctx.advance(text, i);
    if (ctx.skipLength > 0) {
      i += ctx.skipLength - 1;
      ctx.skipLength = 0;
      continue;
    }
    if (ctx.isActive()) {
      continue;
    }
    if (text.charAt(i) === target) {
      return i;
    }
  }
  return -1;
}

function _extractBalancedParentheses(text, openIndex) {
  var ctx = _createScanContext();
  var depth = 1;
  var contentStart = openIndex + 1;
  for (var i = openIndex + 1; i < text.length; i += 1) {
    ctx.advance(text, i);
    if (ctx.skipLength > 0) {
      i += ctx.skipLength - 1;
      ctx.skipLength = 0;
      continue;
    }
    if (ctx.isActive()) {
      continue;
    }
    var ch = text.charAt(i);
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return {
          content: text.slice(contentStart, i),
          endIndex: i + 1
        };
      }
    }
  }
  return undefined;
}

function _locateBodyLiteral(text, fromIndex) {
  var ctx = _createScanContext();
  var depth = 0;
  for (var i = fromIndex; i < text.length; i += 1) {
    ctx.advance(text, i);
    if (ctx.skipLength > 0) {
      i += ctx.skipLength - 1;
      ctx.skipLength = 0;
      continue;
    }
    if (ctx.isActive()) {
      continue;
    }
    var ch = text.charAt(i);
    if (ch === "(") depth += 1;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (
      (ch === "A" || ch === "a") &&
      depth === 0 &&
      _isKeywordAt(text, i, "AS")
    ) {
      var literalStart = _skipWhitespace(text, i + 2);
      var nextChar = text.charAt(literalStart);
      if (nextChar === "$") {
        var dollar = _readDollarLiteral(text, literalStart);
        if (!dollar) return undefined;
        return {
          keywordIndex: i,
          literalStart: dollar.start,
          literalEnd: dollar.end,
          literal: dollar.literal,
          bodyText: string.trim(string.convertLineEndingsToWin(dollar.content), {
            emptyLinesOnly: true
          })
        };
      }
      if (nextChar === "'") {
        var single = _readSingleQuotedLiteral(text, literalStart);
        if (!single) return undefined;
        var cursor = _skipWhitespace(text, single.end);
        var literalEnd = single.end;
        if (text.charAt(cursor) === ",") {
          var secondStart = _skipWhitespace(text, cursor + 1);
          if (text.charAt(secondStart) === "'") {
            var second = _readSingleQuotedLiteral(text, secondStart);
            literalEnd = second.end;
            single.literal += text.slice(single.end, literalEnd);
          }
        }
        return {
          keywordIndex: i,
          literalStart: literalStart,
          literalEnd: literalEnd,
          literal: text.slice(literalStart, literalEnd),
          bodyText: string.trim(string.convertLineEndingsToWin(single.content), {
            emptyLinesOnly: true
          })
        };
      }
    }
  }
  return undefined;
}

function _isKeywordAt(text, index, keyword) {
  var segment = text.substr(index, keyword.length);
  return (
    segment.toUpperCase() === keyword &&
    !_isIdentifierChar(text.charAt(index - 1)) &&
    !_isIdentifierChar(text.charAt(index + keyword.length))
  );
}

function _createScanContext() {
  return {
    mode: "normal",
    skipLength: 0,
    advance: function (text, index) {
      var ch = text.charAt(index);
      var next = text.charAt(index + 1);
      this.skipLength = 0;
      if (this.mode === "line") {
        if (ch === "\n" || ch === "\r") this.mode = "normal";
        return;
      }
      if (this.mode === "block") {
        if (ch === "*" && next === "/") {
          this.mode = "normal";
          this.skipLength = 2;
        }
        return;
      }
      if (this.mode === "dollar") {
        if (text.substr(index, this.tag.length) === this.tag) {
          this.mode = "normal";
          this.skipLength = this.tag.length;
        }
        return;
      }
      if (this.mode === "single") {
        if (ch === "'" && text.charAt(index + 1) !== "'") {
          this.mode = "normal";
        } else if (ch === "'" && text.charAt(index + 1) === "'") {
          this.skipLength = 2;
        }
        return;
      }
      if (this.mode === "double") {
        if (ch === '"') this.mode = "normal";
        return;
      }
      if (ch === "-" && next === "-") {
        this.mode = "line";
        this.skipLength = 2;
        return;
      }
      if (ch === "/" && next === "*") {
        this.mode = "block";
        this.skipLength = 2;
        return;
      }
      if (ch === "$") {
        var tagMatch = text.substring(index).match(/^\$[A-Za-z0-9_]*\$/);
        if (tagMatch) {
          this.mode = "dollar";
          this.tag = tagMatch[0];
          this.skipLength = this.tag.length;
          return;
        }
      }
      if (ch === "'") {
        this.mode = "single";
        return;
      }
      if (ch === '"') {
        this.mode = "double";
      }
    },
    isActive: function () {
      return this.mode !== "normal";
    }
  };
}

function _skipWhitespace(text, index) {
  var i = index;
  while (i < text.length && /\s/.test(text.charAt(i))) {
    i += 1;
  }
  return i;
}

function _isIdentifierChar(char) {
  return /[A-Za-z0-9_]/.test(char || "");
}

function _readDollarLiteral(text, start) {
  var tagMatch = text.substring(start).match(/^\$[A-Za-z0-9_]*\$/);
  if (!tagMatch) return undefined;
  var tag = tagMatch[0];
  var closing = text.indexOf(tag, start + tag.length);
  if (closing === -1) return undefined;
  return {
    start: start,
    end: closing + tag.length,
    literal: text.substring(start, closing + tag.length),
    content: text.substring(start + tag.length, closing)
  };
}

function _readSingleQuotedLiteral(text, start) {
  var i = start + 1;
  while (i < text.length) {
    if (text.charAt(i) === "'") {
      if (text.charAt(i + 1) === "'") {
        i += 2;
        continue;
      }
      return {
        start: start,
        end: i + 1,
        literal: text.substring(start, i + 1),
        content: text.substring(start + 1, i).replace(/''/g, "'")
      };
    }
    i += 1;
  }
  return undefined;
}

function _extractClause(segment, keyword, terminators) {
  if (!segment) return "";
  var search = segment + "\n__END__";
  var keywordUpper = keyword.replace(/\s+/g, " ").toUpperCase();
  var terminatorFiltered = array.filter(terminators, function (term) {
    return term && term.toUpperCase() !== keywordUpper;
  });
  var terminatorPattern = terminatorFiltered.concat(["__END__"]).join("|");
  var pattern = new RegExp(
    keyword.replace(/\s+/g, "\\s+") +
      "\\s+([\\s\\S]+?)(?=\\b(" +
      terminatorPattern +
      ")\\b)",
    "i"
  );
  var match = pattern.exec(search);
  return match ? string.trim(match[1]) : "";
}

function _extractLanguage(segment) {
  if (!segment) return "";
  var match = segment.match(/LANGUAGE\s+(?:"([^"]+)"|([A-Za-z0-9_]+))/i);
  if (!match) return "";
  return match[1] || match[2] || "";
}

function _extractNumericOption(segment, keyword) {
  if (!segment) return undefined;
  var regex = new RegExp(keyword + "\\s+([0-9]+(?:\\.[0-9]+)?)", "i");
  var match = regex.exec(segment);
  return match ? match[1] : undefined;
}

function _extractParallelOption(segment) {
  if (!segment) return undefined;
  var match = segment.match(/PARALLEL\s+(SAFE|RESTRICTED|UNSAFE)/i);
  return match ? match[1].toUpperCase() : undefined;
}

function _wrapWithSpaces(value) {
  return " " + (value || "") + " ";
}

function _collapseWhitespace(value) {
  if (!value) return "";
  return string.trim(value).replace(/\s+/g, " ");
}

function _containsWord(haystack, needle) {
  var pattern = new RegExp("\\b" + needle + "\\b", "i");
  return pattern.test(haystack);
}

function _containsPhrase(haystack, phrase) {
  return haystack.indexOf(phrase) !== -1;
}

function _formatArgumentList(content) {
  if (!content) return "";
  var normalized = string.trim(string.convertLineEndingsToWin(content), {
    emptyLinesOnly: true
  });
  return normalized ? normalized + "\r\n" : "";
}

function _resolveLanguage(languageClause) {
  if (!languageClause) return "user-defined";
  var normalized = languageClause.toLowerCase();
  return LANGUAGES[normalized] || "user-defined";
}


// ---------------------------------------- Add Body Marker ---------------------------------------- //

/**
 * Ensures a canonical `@GUID {....}` marker exists inside a PostgreSQL function body.
 * - LANGUAGE plpgsql: inserts the marker on the first line after BEGIN when missing.
 * - LANGUAGE sql: inserts the marker immediately after the opening $$ line when missing.
 * - Existing `@GUID {..}` lines are replaced in place instead of duplicating the marker.
 *
 * @param {string} functionSql - Full CREATE FUNCTION/PROCEDURE definition.
 * @param {string} guid        - GUID literal with or without braces.
 * @returns {string}           - Script with the GUID marker enforced, or the original text when unchanged.
 */
function insertBodyText(functionSql, guid) {
  if (!functionSql || !guid) return functionSql;

  var cleanedGuid = string.trim((guid + "").replace(/[{}]/g, ""));
  if (!string.validateGuid(cleanedGuid)) return functionSql;
  var markerLine = "@GUID {" + cleanedGuid.toUpperCase() + "}";

  var windowsSql = string.convertLineEndingsToWin(functionSql);
  var parsed = parse(windowsSql);
  if (!parsed || !parsed.asClause) return functionSql;

  var literal = _extractDollarLiteral(parsed.asClause);
  if (!literal) return functionSql;

  var body = literal.body;
  var updatedBody = _replaceGuidLine(body, markerLine);

  if (!updatedBody) {
    var annotatedMarker = "-- " + markerLine + " - DON'T CHANGE THIS LINE! TOAD Data Modeler uses this ID in sync.";
    if (/\bLANGUAGE\s+"?plpgsql"?/i.test(windowsSql))
      updatedBody = _insertAfterBeginLine(body, annotatedMarker);
    else updatedBody = _insertAfterOpeningLine(body, annotatedMarker);
  }

  if (!updatedBody) return functionSql;
  var updatedLiteral = literal.open + updatedBody + literal.close;
  var updatedSql = windowsSql.replace(parsed.asClause, updatedLiteral);
  return _matchOriginalLineEndings(functionSql, updatedSql);
}

function _extractDollarLiteral(asClause) {
  if (!asClause) return undefined;
  var delimiterMatch = asClause.match(/\$[A-Za-z0-9_]*\$/);
  if (!delimiterMatch) return undefined;
  var delimiter = delimiterMatch[0];
  var startIndex = asClause.indexOf(delimiter);
  var endIndex = asClause.lastIndexOf(delimiter);
  if (endIndex === -1 || endIndex <= startIndex) return undefined;
  return {
    open: asClause.slice(0, startIndex + delimiter.length),
    body: asClause.slice(startIndex + delimiter.length, endIndex),
    close: asClause.slice(endIndex)
  };
}

function _insertAfterOpeningLine(body, markerText) {
  var lineBreakMatch = body.match(/(\r\n|\n|\r)/);
  var newline = lineBreakMatch ? lineBreakMatch[0] : "\r\n";
  var insertIndex = lineBreakMatch ? lineBreakMatch.index + newline.length : 0;
  return body.slice(0, insertIndex) + markerText + newline + body.slice(insertIndex);
}

function _insertAfterBeginLine(body, markerText) {
  var beginRegex = /(^|\r?\n)([ \t]*)BEGIN\b/i;
  var match = beginRegex.exec(body);

  if (!match) return undefined;

  var beginEndIndex = match.index + match[0].length;
  var remainder = body.slice(beginEndIndex);
  var newlineMatch = remainder.match(/(\r\n|\n|\r)/);
  var newline = newlineMatch ? newlineMatch[0] : "\r\n";
  var insertIndex = newlineMatch
    ? beginEndIndex + newlineMatch.index + newline.length
    : body.length;

  var indentMatch = body.slice(insertIndex).match(/^[ \t]*/);
  var indent = indentMatch ? indentMatch[0] : match[2] || "  ";

  return body.slice(0, insertIndex) + indent + markerText + newline + body.slice(insertIndex);
}

function _replaceGuidLine(body, markerLine) {
  var regex = /(^|\r?\n)([ \t]*)(--[ \t]*)?@GUID\s*\{[^}]+\}([^\r\n]*)(\r?\n|$)/i;
  var replaced = false;
  var updated = body.replace(regex, function (_, prefixBreak, indent, commentPrefix, suffix, newline) {
    replaced = true;
    var prefix = commentPrefix || "";
    return (prefixBreak || "") + indent + prefix + markerLine + suffix + (newline || "");
  });
  return replaced ? updated : undefined;
}

function _matchOriginalLineEndings(original, windowsText) {
  if (original.indexOf("\r\n") !== -1) return windowsText;
  if (original.indexOf("\n") !== -1) return windowsText.replace(/\r\n/g, "\n");
  if (original.indexOf("\r") !== -1) return windowsText.replace(/\r\n/g, "\r");
  return windowsText;
}
