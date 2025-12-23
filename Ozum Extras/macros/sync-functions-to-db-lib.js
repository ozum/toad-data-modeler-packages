/**
 * Synchronizes SQL files under `db-lib/functions` and `db-lib/procedures`
 * with the active Toad model.  Updates each file's GUID marker, loads
 * the objects into the model, and deletes orphaned model items that
 * no longer have a backing SQL definition.
 */
var log;
var model;
var fso;

function Main() {
  log = toad.getLog();
  model = toad.getModel();
  fso = toad.getFso();

  model.lock()
  var idLookup = {};
  idLookup = traverse(toad.getModelFolderPath() + "db-lib\\functions", idLookup);
  idLookup = traverse(toad.getModelFolderPath() + "db-lib\\procedures", idLookup);

  var items = list.toArray(model.Functions).concat(list.toArray(model.Procedures));

  if (object.keys(idLookup).length > 0) {
    log.information("Sync complete. Deleting orphaned items.");
    array.forEach(items, function (item) {
      if (!idLookup[item.Id]) item.Delete();
    });
  } else {
    log.information("No items found in file system. Skipping deletion step.");
  }

  model.unlock();
}

function traverse(folderPath, idLookup) {
  if (fso.folderExists(folderPath)) {
    log.information("Starting to traverse: " + folderPath);
    idLookup = fs.traverseFiles(folderPath, syncToModel, { extension: "sql" }, idLookup);
  } else {
    log.information("Folder not found. Skipping: " + folderPath);
  }
  return idLookup;
}

function syncToModel(file, accumulator) {
  //log.information("Processing file: " + file.name);
  var content = fs.readFile(file.path);
  var parsedContent = functionParser.parse(content);
  var guidFromFile = parsedContent.guid;
  var item = functionParser.updateFrom(parsedContent);
  var guidFromItem = item.id;

  // Update the file if the GUIDs differ.
  if (guidFromFile !== guidFromItem)
    fs.writeFile(file.path, functionParser.insertBodyText(content, guidFromItem));

  // Add to accumulator to detect items to delete.
  accumulator[guidFromItem] = true;
  return accumulator;
}
