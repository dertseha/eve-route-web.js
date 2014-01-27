/* global __dirname */
"use strict";

var path = require("path");
var http = require("http");

var express = require("express");

var WebServer = function(injector) {
  this.log = injector.getValue("log");
  this.httpConfig = injector.getValue("config").get("http");
};

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
  this.webServer.get("/", function(req, res) {
    var clientConfig = {};
    var pageOptions = {
      clientConfig: JSON.stringify(clientConfig),
      build: req.query.build || "min"
    };

    res.render("root", pageOptions);
  });

  this.webServer.post("/route/find", function(req, res) {
    res.redirect("/");
  });

};

WebServer.prototype.onServerListening = function() {
  this.log.info("Web server is listening");
};

module.exports = WebServer;
