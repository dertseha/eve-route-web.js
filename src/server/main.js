/* global process */
"use strict";

function getConfiguration() {
  var nconf = require("nconf");

  nconf.use("memory");

  nconf.argv();
  nconf.env();
  nconf.defaults({
    "http": {
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

function startWebServer(injector) {
  injector.getValue("log").info("Starting application...");

  var WebServer = require("./WebServer/WebServer.js");

  var webServer = new WebServer(injector);

  webServer.start();
}

function buildBaseUniverse(injector) {
  injector.getValue("log").info("Building Universe...");

  var builder = require("./BaseUniverseBuilder");
  var universe = builder.build();

}

function main() {
  var infuse = require("infuse.js");
  var injector = new infuse.Injector();

  injector.mapValue("tv4", require("tv4"));

  injector.mapValue("config", getConfiguration());
  injector.mapValue("log", getLogger());

  buildBaseUniverse(injector);

  startWebServer(injector);
}

main();
