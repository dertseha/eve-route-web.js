/* global __dirname */
"use strict";

var path = require("path");
var http = require("http");

var _ = require("underscore");
var express = require("express");
var Promise = require("bluebird");

function WebServer(injector, messageLibrary, businessLogic) {
  this.log = injector.getValue("log");
  this.httpConfig = injector.getValue("config").get("http");
  this.messageLibrary = messageLibrary;
  this.businessLogic = businessLogic;
}

WebServer.DEFAULT_SECRET = "Some secret secret";

WebServer.prototype.getSecret = function() {
  return this.httpConfig.secret || WebServer.DEFAULT_SECRET;
};

WebServer.prototype.getServerPort = function() {
  return this.httpConfig.port;
};

WebServer.prototype.start = function() {
  var secret = this.getSecret();
  var self = this;

  if (secret === WebServer.DEFAULT_SECRET) {
    this.log.warn("HTTP configuration uses some defaults that should not be used");
  }

  this.cookieParser = express.cookieParser(secret);

  this.setupServer();
  this.setupRoutes();

  this.httpServer = http.createServer(this.webServer);
  this.httpServer.listen(this.webServer.get("port"), function() {
    self.onServerListening();
  });
};

WebServer.prototype.setupServer = function() {
  var webServer = express();
  var secret = this.getSecret();
  var serverPort = this.getServerPort();
  var self = this;

  this.log.info("Setting up HTTP server on port " + serverPort);
  webServer.configure(function() {
    webServer.set("port", serverPort);
    webServer.set("views", __dirname + "/views");
    webServer.set("view engine", "jade");
    webServer.use(express.favicon(path.join(__dirname, "../../wwwroot/style/favicon.ico")));
    webServer.use(self.cookieParser);
    webServer.use(express.json());
    webServer.use(express.urlencoded());
    webServer.use(express.session({
      secret: secret
    }));
    webServer.use(webServer.router);
    webServer.use(express["static"](path.join(__dirname, "../../wwwroot")));
  });

  this.webServer = webServer;
};

WebServer.prototype.setupRoutes = function() {
  var self = this;

  this.webServer.get("/", _.bind(this.onGetIndex, this));

  this.webServer.post("/route/find", _.bind(this.onPostRouteFind, this));
};

WebServer.prototype.onServerListening = function() {
  this.log.info("Web server is listening");
};

WebServer.prototype.onGetIndex = function(req, res) {
  var clientConfig = {};
  var pageOptions = {
    clientConfig: JSON.stringify(clientConfig),
    build: req.query.build || "min"
  };

  res.render("root", pageOptions);
};

WebServer.prototype.onPostRouteFind = function(req, res) {
  var log = this.log;
  var messageLibrary = this.messageLibrary;
  var keptResult = null;

  function sendError(status, message) {
    res.status(status).json({
      error: message
    });
  }

  function sendResult(result) {
    if (messageLibrary.isValidData(result, "RouteResponse.json")) {
      res.json(result);
    } else {
      sendError(500, "Server wanted to send response not matching schema. Contact support.");
    }
  }

  if (!req.is("application/json")) {
    sendError(400, "Must provide application/json content type");

  } else if (!messageLibrary.isValidData(req.body, "RouteRequest.json")) {
    sendError(400, "Request body is not according to schema");

  } else {
    var promise = this.businessLogic.requestRoute(req.body);
    var timedPromise = promise.timeout(20000).then(function(finalResult) {
      sendResult(finalResult);

    }).progressed(function(intermediateResult) {
      keptResult = intermediateResult;

    }).caught(Promise.TimeoutError, function() {
      promise.cancel();

      if (keptResult) {
        log.info("Serving intermediate result after timeout");
        sendResult(keptResult);
      } else {
        sendError(503, "No result received within time.");
      }

    }).caught(Promise.CancellationError, function(err) {
      sendError(500, "Operation was cancelled");
    }).error(function(error) {
      if (error.source && error.source === "client") {
        sendError(400, error.cause);
      } else {
        log.error("Internal error handling route request: " + JSON.stringify(error));
        sendError(500, "Internal Server Error");
      }
    });
  }
};

module.exports = WebServer;
