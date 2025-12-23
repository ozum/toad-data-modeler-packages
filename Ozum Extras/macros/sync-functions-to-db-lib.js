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

  // Delete orphaned items previosuly added from file system. (Non added items does not have @GUID number in SQL.)
  if (object.keys(idLookup).length > 0) {
    log.information("Sync complete. Deleting orphaned items.");
    array.forEach(items, function (item) {
      if (!idLookup[item.Id] && functionParser.extractGUID(item.sql)) item.Delete();
    });
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
  var relativePath = path.relative(toad.getModelFolderPath() + "db-lib", file.path);
  //log.information("Processing file: " + relativePath);
  
  try {
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
  } catch (e) {
    log.error("Cannot process file: " + relativePath + " Error: " + e.message);
  }
  
  return accumulator;
}
