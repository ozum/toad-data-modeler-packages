// Globals
var app;
var model;
var log;
var fso;
var modelFolderPath;

function setGlobals() {
  app = System.GetInterface("Application");
  model = app.ActiveModel || Model;
  log = System.CreateObject("Log");
  fso = new ActiveXObject("Scripting.FileSystemObject");
  modelFolderPath = path.dirname(model.filePath);
}

function getModel() {
  if (!app) setGlobals();
  return model;
}

function getLog() {
  if (!app) setGlobals();
  return log;
}

function getFso() {
  if (!app) setGlobals();
  return fso;
}

function getApp() {
  if (!app) setGlobals();
  return app;
}

function getModelFolderPath() {
  if (!app) setGlobals();
  return modelFolderPath;
}
