/* global __dirname */
"use strict";

var fs = require("fs");
var path = require("path");

var everoute = require("eve-route");

function getTableKeys(table) {
  return table.names.reduce(function(keys, key, index) {
    keys[key] = index;
    return keys;
  }, {});
}

function getGalaxyIdForSolarSystem(solarSystemData, mapSolarSystemKeys) {
  var name = solarSystemData[mapSolarSystemKeys.solarSystemName];
  var regionId = solarSystemData[mapSolarSystemKeys.regionId];
  var isWSpace = (name.length === 7) && (name[0] === "J") && regionId >= 11000000;

  return isWSpace ? everoute.util.constants.GALAXY_ID_W_SPACE : everoute.util.constants.GALAXY_ID_NEW_EDEN;
}

function addSolarSystems(builder, solarSystemIdsByName) {
  var mapSolarSystems = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/solarSystems.json")));
  var mapSolarSystemKeys = getTableKeys(mapSolarSystems);

  mapSolarSystems.data.forEach(function(solarSystemData) {
    var solarSystemId = solarSystemData[mapSolarSystemKeys.solarSystemId];
    var name = solarSystemData[mapSolarSystemKeys.solarSystemName];
    var contextIds = {
      galaxyId: getGalaxyIdForSolarSystem(solarSystemData, mapSolarSystemKeys),
      regionId: solarSystemData[mapSolarSystemKeys.regionId],
      constellationId: solarSystemData[mapSolarSystemKeys.constellationId]
    };
    var x = solarSystemData[mapSolarSystemKeys.x];
    var y = solarSystemData[mapSolarSystemKeys.y];
    var z = solarSystemData[mapSolarSystemKeys.z];
    var location = new everoute.travel.SpecificLocation(x, y, z);
    var security = solarSystemData[mapSolarSystemKeys.security];

    solarSystemIdsByName[name] = solarSystemId;
    builder.addSolarSystem(solarSystemId, contextIds, location, security);
  });
}

function getJumpGateKey(fromSolarSystemId, toSolarSystemId) {
  return "" + fromSolarSystemId + "->" + toSolarSystemId;
}

function getJumpGateLocations(solarSystemIdsByName) {
  var viewJumpGates = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/jumpGates.json")));
  var viewJumpGateKeys = getTableKeys(viewJumpGates);
  var result = {};

  viewJumpGates.data.forEach(function(jumpGateData) {
    var solarSystemId = jumpGateData[viewJumpGateKeys.solarSystemId];
    var itemName = jumpGateData[viewJumpGateKeys.itemName];
    var name = itemName.substring(itemName.indexOf("(") + 1, itemName.indexOf(")"));
    var key = getJumpGateKey(solarSystemId, solarSystemIdsByName[name]);
    var x = jumpGateData[viewJumpGateKeys.x];
    var y = jumpGateData[viewJumpGateKeys.y];
    var z = jumpGateData[viewJumpGateKeys.z];
    var location = new everoute.travel.SpecificLocation(x, y, z);

    result[key] = location;
  });

  return result;
}

function addJumpGates(builder, solarSystemIdsByName) {
  var mapSolarSystemJumps = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/solarSystemJumps.json")));
  var mapSolarSystemJumpKeys = getTableKeys(mapSolarSystemJumps);
  var jumpGateLocations = getJumpGateLocations(solarSystemIdsByName);

  mapSolarSystemJumps.data.forEach(function(jumpData) {
    var fromSolarSystemId = jumpData[mapSolarSystemJumpKeys.fromSolarSystemId];
    var toSolarSystemId = jumpData[mapSolarSystemJumpKeys.toSolarSystemId];
    var extension = builder.extendSolarSystem(fromSolarSystemId);
    var jump = extension.addJump(everoute.travel.capabilities.jumpGate.JUMP_TYPE, toSolarSystemId);
    var fromLocation = jumpGateLocations[getJumpGateKey(fromSolarSystemId, toSolarSystemId)];
    var toLocation = jumpGateLocations[getJumpGateKey(toSolarSystemId, fromSolarSystemId)];

    if (!fromLocation || !toLocation) {
      throw new Error("Jump Gate location missing for system connection " + getJumpGateKey(fromSolarSystemId, toSolarSystemId));
    }

    jump.from(fromLocation);
    jump.to(toLocation);
  });
}

function buildBaseUniverse() {
  var builder = everoute.newUniverseBuilder();
  var solarSystemIdsByName = {};

  addSolarSystems(builder, solarSystemIdsByName);

  everoute.travel.rules.transitCount.extendUniverse(builder);
  everoute.travel.rules.security.extendUniverse(builder);

  addJumpGates(builder, solarSystemIdsByName);
  everoute.travel.capabilities.jumpDrive.extendUniverse(builder, 5);

  return builder.build();
}

module.exports = {
  build: buildBaseUniverse
};
