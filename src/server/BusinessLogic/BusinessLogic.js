/* global setImmediate */
"use strict";

var _ = require("underscore");
var Promise = require("bluebird");

var everoute = require("eve-route");

function BusinessLogic(injector) {
  this.log = injector.getValue("log");
  this.baseUniverse = injector.getValue("baseUniverse");
}

BusinessLogic.prototype.requestRoute = function(request) {
  var self = this;
  var resolver = Promise.defer();
  var promise = resolver.promise.cancellable();
  var result = null;
  var resultCollector = {
    collect: function(route) {
      result = self.createResult(route);
      resolver.progress(result);
    }
  };
  var task;

  function runIteration() {
    if (!promise.isResolved()) {
      try {
        if (task()) {
          setImmediate(runIteration);
        } else {
          resolver.resolve(result);
        }
      } catch (e) {
        resolver.reject({
          source: "server",
          cause: e.toString()
        });
      }
    }
  }

  try {
    task = this.createTaskForRequest(request, resultCollector);
    setImmediate(runIteration);
  } catch (e) {
    setImmediate(function() {
      resolver.reject({
        source: "client",
        cause: e.toString()
      });
    });
  }

  return promise;
};

BusinessLogic.prototype.createResult = function(route) {
  var steps = route.getSteps();
  var result = {};

  result.path = steps.map(function(step) {
    var pathEntry = {
      solarSystem: step.getSolarSystemId()
    };

    return pathEntry;
  });

  return result;
};

BusinessLogic.prototype.createTaskForRequest = function(request, resultCollector) {
  var universe = this.baseUniverse;
  var startPaths = request.route.from.solarSystems.map(function(start) {
    return universe.getSolarSystem(start).startPath();
  });
  var rule = this.getRuleForRequest(request);
  var capability = this.getCapabilityForRequest(request);
  var builder = new everoute.travel.search.RouteFinderBuilder(capability,
    rule, startPaths, resultCollector);

  builder.setWaypoints(this.getWaypointsForRequest(request, rule));
  builder.setDestination(this.getDestinationForRequest(request, rule));

  var finder = builder.build();

  return function() {
    return finder.continueSearch();
  };
};

BusinessLogic.prototype.getCapabilityForRequest = function(request) {
  var capabilities = [];

  if (request.capabilities.jumpGate) {
    capabilities.push(new everoute.travel.capabilities.jumpGate.JumpGateTravelCapability(this.baseUniverse));
  }

  return new everoute.travel.capabilities.CombiningTravelCapability(capabilities);
};

BusinessLogic.prototype.getRuleForRequest = function(request) {
  var rules = [];
  var gotTransitCount = false;
  var key;


  if (request.rules) {
    rules = _.map(_.sortBy(_.pairs(request.rules), function(entry) {
      return entry[1].priority;
    }), function(ruleData) {
      var ruleType = ruleData[0];
      var param = ruleData[1];
      var result = null;

      if (ruleType === "transitCount") {
        result = everoute.travel.rules.transitCount.getRule();
        gotTransitCount = true;
      } else if (ruleType === "minSecurity") {
        result = everoute.travel.rules.security.getMinRule(param.limit);
      } else if (ruleType === "maxSecurity") {
        result = everoute.travel.rules.security.getMaxRule(param.limit);
      } else {
        throw new Error("Unknown rule type <" + ruleType + ">");
      }

      return result;
    });
  }
  if (!gotTransitCount) {
    rules.push(everoute.travel.rules.transitCount.getRule());
  }

  return new everoute.travel.rules.TravelRuleset(rules);
};

BusinessLogic.prototype.getWaypointsForRequest = function(request, rule) {
  var self = this;
  var waypoints = [];

  if (request.route.via) {
    request.route.via.forEach(function(via) {
      var criterion = self.getSearchCriterionForEntry(via, rule);

      if (criterion) {
        waypoints.push(criterion);
      }
    });
  }

  return waypoints;
};

BusinessLogic.prototype.getDestinationForRequest = function(request, rule) {
  var destination = null;

  if (request.route.to) {
    destination = this.getSearchCriterionForEntry(request.route.to, rule);
  }

  return destination;
};

BusinessLogic.prototype.getSearchCriterionForEntry = function(entry, rule) {
  var criterion = null;

  if (entry.solarSystem) {
    criterion = new everoute.travel.search.CombiningSearchCriterion([
      new everoute.travel.search.DestinationSystemSearchCriterion(
        this.baseUniverse.getSolarSystem(entry.solarSystem).getId()),
      new everoute.travel.search.CostAwareSearchCriterion(rule)
    ]);
  }

  return criterion;
};

module.exports = BusinessLogic;
