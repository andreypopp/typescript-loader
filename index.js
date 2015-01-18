/**
 * @copyright 2015, Andrey Popp <me@andreypopp.com>
 */
'use strict';

var fs            = require('fs');
var ts            = require('typescript');
var path          = require('path');
var objectAssign  = require('object-assign');
var Promise       = require('bluebird');

var readFile = Promise.promisify(fs.readFile);

function TypeScriptPlugin(options) {
  options = options || {};
  this.options = {};
  objectAssign(this.options, options);
  if (options.target === undefined) {
    options.target = ts.ScriptTarget.ES5;
  }
  if (options.module === undefined) {
    options.module = ts.ModuleKind.CommonJS;
  }
  this.files = {};
  this.services = ts.createLanguageService(this, ts.createDocumentRegistry());
  this.addFile(this.getDefaultLibFilename());
}

TypeScriptPlugin.prototype.apply = function apply(compiler) {
  compiler.typeScriptPlugin = this;
};

TypeScriptPlugin.prototype.getScriptFileNames = function getScriptFileNames() {
  return Object.keys(this.files).concat(this.getDefaultLibFilename());
};

TypeScriptPlugin.prototype.getScriptVersion = function getScriptVersion(filename) {
  return this.files[filename] && this.files[filename].version.toString();
};

TypeScriptPlugin.prototype.getScriptSnapshot = function getScriptSnapshot(filename) {
  var file = this.files[filename];
  return {
    getText: function(start, end) {
      return file.text.substring(start, end);
    },
    getLength: function() {
      return file.text.length;
    },
    getLineStartPositions: function() {
      return [];
    },
    getChangeRange: function(oldSnapshot) {
      return undefined;
    }
  };
};

TypeScriptPlugin.prototype.getCurrentDirectory = function getCurrentDirectory() {
  return process.cwd();
};

TypeScriptPlugin.prototype.getScriptIsOpen = function getScriptIsOpen() {
  return true;
};

TypeScriptPlugin.prototype.getCompilationSettings = function getCompilationSettings() {
  return this.options;
};

TypeScriptPlugin.prototype.getDefaultLibFilename = function getDefaultLibFilename(options) {
  return require.resolve('typescript/bin/lib.d.ts');
};

TypeScriptPlugin.prototype.log = function log(message) {
  return console.log(message);
};

TypeScriptPlugin.prototype.addFile = function addFile(filename, text) {
  if (text === undefined) {
    text = fs.readFileSync(filename, 'utf8');
  }
  var prevFile = this.files[filename];
  var version = 0;
  if (prevFile) {
    version = prevFile.version;
    if (prevFile.text !== text) {
      version = version + 1;
    }
  }
  this.files[filename] = {text: text, version: version};
};

TypeScriptPlugin.prototype.emit = function emit(resolver, filename, text, cb) {
  this.addFile(filename, text);

  var result = Promise.resolve();
  var found = [];
  this.findImportStatement(found, this.services.getSourceFile(filename));

  result = result
    .then(function() {
      return Promise.all(found.map(function(filename) {
        return resolve(filename).then(function(filename) {
          return readFile(filename, 'utf8').then(function(text) {
            return {text: text, filename: filename};
          });
        });
      }));
    })
    .then(function(deps) {
      deps.forEach(function(dep) {
        this.addFile(dep.filename, dep.text);
      }, this);
    }.bind(this));

  result.then(function() {
    var output = this.services.getEmitOutput(filename);
    if (output.emitOutputStatus === ts.EmitReturnStatus.Succeeded) {
      cb(null, {output: output});
    } else {
      var errors = this.services
        .getCompilerOptionsDiagnostics()
        .concat(this.services.getSyntacticDiagnostics(filename))
        .concat(this.services.getSemanticDiagnostics(filename));
      cb(null, {errors: errors});
    }
  }.bind(this), cb);

  function resolve(input) {
    return new Promise(function(resolve, reject) {
      resolver(path.dirname(filename), input, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
};

TypeScriptPlugin.prototype.findImportStatement = function findImportStatement(found, node) {
  if (node.kind === ts.SyntaxKind.ImportDeclaration) {
    found.push(node.moduleReference.expression.text);
  } else {
    ts.forEachChild(node, this.findImportStatement.bind(this, found));
  }
};

module.exports = TypeScriptPlugin;
