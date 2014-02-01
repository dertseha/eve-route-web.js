/* global process */

"use strict";

var fs = require("fs");
var path = require("path");

var schemaUriBase = "https://github.com/dertseha/eve-route-web.js/blob/master/src/schema/";

var joinUri = function() {
  var result = [];
  var parts = Array.prototype.slice.apply(arguments);

  parts.forEach(function(part) {
    var start = part[0] === "/" ? 1 : 0;
    var end = part[part.length - 1] === "/" ? part.length - 1 : part.length;

    result.push(part.substring(start, end));
  });

  return result.join("/");
};

function MessageLibrary(injector) {
  this.log = injector.getValue("log");
  this.tv4 = injector.getValue("tv4").freshApi();
}

MessageLibrary.prototype.loadSchema = function(uri) {
  var pathBase = path.join(process.cwd(), "/src/schema/");
  var filePath = path.join(pathBase, uri.substr(schemaUriBase.length));

  if ((filePath.substr(0, pathBase.length) === pathBase) && fs.existsSync(filePath)) {
    this.log.info("Loading schema file <" + filePath + ">");
    this.loadSchemaFile(filePath, uri);
    this.loadMissingSchemata();
  } else {
    this.log.warn("Unknown schema file <" + filePath + "> from <" + uri + ">");
  }
};

MessageLibrary.prototype.loadSchemaFile = function(filePath, id) {
  var content = JSON.parse(fs.readFileSync(filePath));

  content.id = id;

  this.tv4.addSchema(content);
};

MessageLibrary.prototype.loadMissingSchemata = function() {
  var missing = this.tv4.getMissingUris();
  var self = this;

  missing.forEach(function(entry) {
    self.log.debug("Requesting missing schema <" + entry + ">");
    self.loadSchema(entry);
  });
};

MessageLibrary.prototype.getSchema = function(schemaUri) {
  var schema = this.tv4.getSchema(schemaUri);

  if (!schema) {
    this.loadSchema(schemaUri);
    schema = this.tv4.getSchema(schemaUri);
  }

  return schema;
};

MessageLibrary.prototype.isValidData = function(data, schemaName) {
  var schema = this.getSchema(joinUri(schemaUriBase, schemaName));

  return !!schema && this.tv4.validate(data, schema);
};

module.exports = MessageLibrary;
