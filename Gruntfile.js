"use strict";
var path = require("path");

module.exports = function(grunt) {
  var jsFiles = ["Gruntfile.js", "src/server/**/*.js"];

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    // Run JSHint on all sources
    jshint: {
      options: {
        jshintrc: ".jshintrc"
      },
      all: jsFiles
    },

    // JSBeautifier on all sources
    jsbeautifier: {
      standard: {
        src: jsFiles,
        options: {
          js: grunt.file.readJSON(".jsbeautifyrc")
        }
      }
    },

    // JSON-Schema Validation
    tv4: {
      options: {
        root: grunt.file.readJSON("src/schema/json-v4.json"),
        multi: false, // Disabled as long as https://github.com/geraintluff/tv4/issues/74 is present
        banUnknown: false // Disabled as long as https://github.com/geraintluff/tv4/issues/75 is present
      },
      schema: {
        src: ["src/schema/**/*.json"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-jsbeautifier");
  grunt.loadNpmTasks("grunt-tv4");

  grunt.registerTask("lint", ["jshint", "tv4"]);
  grunt.registerTask("format", ["jsbeautifier"]);
  grunt.registerTask("test", []);

  grunt.registerTask("package", ["lint", "format", "test"]);

  grunt.registerTask("default", ["lint", "test"]);
};
