/**
 * Ensures a directory exists before subsequent file operations run.
 * Creates the target folder if it is missing (no-op when already present).
 *
 * @param {string} folderPath - Absolute or relative directory path to create when needed.
 *
 * @example
 * createFolder("C:/tmp/sql");
 */
function createFolder(folderPath) {
  var fso = toad.getFso();
  if (!fso.folderExists(folderPath)) fso.createFolder(folderPath);
}

/**
 * Reads subfolder names under the supplied directory.
 * Supports returning either leaf names or absolute paths depending on the flag.
 *
 * @param {string}  folderPath              - Directory whose immediate subfolders will be enumerated.
 * @param {boolean} [absolute=false]  - When true, returns absolute folder paths; otherwise just names.
 * @returns {string[]} Ordered list of child folder names or paths.
 *
 * @example
 * readFolderNames(App.Model.ModelFileDirectory, true);
 */
function readFolderNames(folderPath, absolute) {
  var fso = toad.getFso();
  var subfolderCollection = fso.getFolder(folderPath).subFolders;
  var paths = [];

  for (var c = new Enumerator(subfolderCollection); !c.atEnd(); c.moveNext())
    paths.push(absolute ? c.item().path : c.item().name);

  return paths;
}

/**
 * Reads file names within a folder using optional absolute path resolution.
 * Accepts an options hash to mimic Array.prototype methods while staying JScript-safe.
 *
 * @param {string} folderPath                            - Directory to enumerate.
 * @param {{ absolute?: boolean }} [options=null]  - Optional flags (absolute=true yields file paths instead of names).
 * @returns {string[]} File names or absolute paths for each entry.
 *
 * @example
 * readFileNames('C:/sql/functions', { absolute: true });
 */
function readFileNames(folderPath, options) {
  options = object.assign(options, { absolute: false });

  var fso = toad.getFso();
  var filesCollection = fso.getFolder(folderPath).files;
  var paths = [];

  for (var c = new Enumerator(filesCollection); !c.atEnd(); c.moveNext())
    paths.push(options.absolute ? c.item().path : c.item().name);

  return paths;
}

/**
 * Reads the entire contents of a UTF-8 text file via ADODB.Stream.
 * Returns undefined when the file does not exist to keep call sites simple.
 *
 * @param {string} filePath - Absolute file path pointing to the text file.
 * @returns {string|undefined} File contents when found; otherwise undefined.
 *
 * @example
 * var sql = readFile('C:/sql/functions/fn_tax_rate.sql');
 */
function readFile(filePath) {
  var fso = toad.getFso();
  // Open the file for input.
  if (fso.FileExists(filePath)) {
    f = fso.OpenTextFile(filePath, 1);
    // Read from the file.
    if (f.AtEndOfStream) return "";
    else return f.ReadAll();
  }
}

/**
 * Writes text content to the specified path, overwriting any existing file.
 * Uses the host's FileSystemObject and logs failures instead of throwing.
 *
 * @param {string} filePath  - Destination path to create or replace.
 * @param {string} content   - Text payload written to the file.
 *
 * @example
 * writeFile('C:/sql/functions/fn_tax_rate.sql', generateSql());
 */
function writeFile(filePath, content) {
  var fso = toad.getFso("Scripting.FileSystemObject");
  try {
    var file = fso.CreateTextFile(filePath, true);
    file.WriteLine(content);
    file.close();
  } catch (e) {
    toad.getLog().error("Failed to write file: " + filePath + " Error: " + e.message);
  }
}

/**
 * Returns the date the specified file was last modified.
 * The value is coerced to a string to simplify serialization to logs.
 *
 * @param {string} filePath - File to inspect.
 * @returns {string|undefined} Date string or undefined when the file is missing.
 *
 * @example
 * var lastSync = getFileModificationDate('C:/sql/functions/fn_tax_rate.sql');
 */
function getFileModificationDate(filePath) {
  var fso = toad.getFso();
  if (fso.FileExists(filePath)) {
    var file = fso.getFile(filePath);
    if (file.DateLastModified != null) return file.DateLastModified + "";
  }
}

/**
 * Recursively traverses files under a directory and invokes a callback per match.
 * Supports extension and RegExp filters plus a running accumulator (e.g., list builder).
 *
 * @param {string} filePath                                    - Root directory to scan.
 * @param {function(File, *): *} callback                  - Invoked with (file, accumulator) per matching file.
 * @param {{ extension?: string|string[], regExp?: RegExp }} [options=null] - Filtering options.
 * @param {*} [accumulator]                                - Seed value threaded through each callback invocation.
 * @returns {*} Final accumulator returned after visiting all files.
 *
 * @example
 * traverseFiles('C:/sql', function(file, acc) { acc.push(file.Path); return acc; }, { extension: '.sql' }, []);
 */
function traverseFiles(filePath, callback, options, accumulator) {
  options = object.assign(options, { extension: null, regExp: null });

  var fso = toad.getFso();
  var folder = fso.getFolder(filePath);

  for (var c = new Enumerator(folder.files); !c.atEnd(); c.moveNext()) {
    var file = c.item();
    var currentExtension = path.extname(file.name);
    var extensionFiltered =
      !options.extension ||
      options.extension === currentExtension ||
      (options.extension instanceof Array &&
        indexOf(options.extension, currentExtension) > -1);
    var regExpFiltered = !options.regExp || file.path.match(options.regExp);

    if (extensionFiltered && regExpFiltered)
      accumulator = callback(file, accumulator);
  }

  for (var c = new Enumerator(folder.subFolders); !c.atEnd(); c.moveNext())
    accumulator = traverseFiles(c.item().path, callback, options, accumulator);

  return accumulator;
}
