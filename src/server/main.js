/* global process, setImmediate */
"use strict";

function getConfiguration() {
  var nconf = require("nconf");

  nconf.use("memory");

  nconf.argv();
  nconf.env();
  nconf.defaults({
    "http": {
      requestTimeoutMSec: 25000,
      port: process.env.PORT || 3000,
      secret: "" // secret for cookies/session
    }
  });

  return nconf;
}

function getLogger() {
  var winston = require("winston");
  var logger = winston.loggers.add("root", {});

  logger.remove(winston.transports.Console);
  logger.setLevels(winston.config.cli.levels);
  logger.add(winston.transports.Console, {
    level: "verbose",
    colorize: true,
    timestamp: true
  });

  return logger;
}

function startWebServer(injector, businessLogic) {
  injector.getValue("log").info("Starting web server...");

  var WebServer = require("./WebServer/WebServer");
  var MessageLibrary = require("./MessageLibrary");

  var webServer = new WebServer(injector, new MessageLibrary(injector), businessLogic);

  webServer.start();
}

function getBaseUniverse(injector) {
  injector.getValue("log").info("Building Universe...");

  var builder = require("./BaseUniverseBuilder");

  return builder.build();
}

function main() {
  var infuse = require("infuse.js");
  var injector = new infuse.Injector();

  var BusinessLogic = require("./BusinessLogic/BusinessLogic");

  injector.mapValue("tv4", require("tv4"));

  injector.mapValue("config", getConfiguration());
  injector.mapValue("log", getLogger());

  startWebServer(injector);

  setImmediate(function() {
    injector.mapValue("baseUniverse", getBaseUniverse(injector));
    injector.mapValue("businessLogic", new BusinessLogic(injector));
    injector.getValue("log").info("Business Logic initialized");
  });
}

main();
