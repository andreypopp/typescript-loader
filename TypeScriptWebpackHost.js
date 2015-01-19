/**
 * @copyright 2015, Andrey Popp <me@andreypopp.com>
 */
'use strict';

var fs            = require('fs');
var util          = require('util');
var path          = require('path');
var ts            = require('typescript');
var objectAssign  = require('object-assign');
var Promise       = require('bluebird');

var DEFAULT_OPTIONS = {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS
};

function TypeScriptWebpackHost(options, fs) {
  this.options = {};
  objectAssign(this.options, DEFAULT_OPTIONS);
  objectAssign(this.options, options);

  this.fs = fs;
  this.files = {};
  this.services = ts.createLanguageService(this, ts.createDocumentRegistry());
}

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getScriptFileNames = function getScriptFileNames() {
  return Object.keys(this.files);
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getScriptVersion = function getScriptVersion(filename) {
  return this.files[filename] && this.files[filename].version.toString();
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getScriptSnapshot = function getScriptSnapshot(filename) {
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

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getCurrentDirectory = function getCurrentDirectory() {
  return process.cwd();
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getScriptIsOpen = function getScriptIsOpen() {
  return true;
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getCompilationSettings = function getCompilationSettings() {
  return this.options;
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getDefaultLibFilename = function getDefaultLibFilename(options) {
  return require.resolve('typescript/bin/lib.d.ts');
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.log = function log(message) {
  return console.log(message);
};

/**
 * Return an array of import declarations found in source file.
 */
TypeScriptWebpackHost.prototype.findImportDeclarations = function findImportDeclarations(filename) {
  var node = this.services.getSourceFile(filename);
  var result = [];
  visit(node);
  return result;

  function visit(node) {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      result.push(node.moduleReference.expression.text);
    } else if (node.kind === ts.SyntaxKind.SourceFile) {
      result = result.concat(node.referencedFiles.map(function(f) {
        return path.resolve(path.dirname(node.filename), f.filename);
      }));
    }
    ts.forEachChild(node, visit);
  }
};

TypeScriptWebpackHost.prototype._addFile = function _addFile(filename, text) {
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

TypeScriptWebpackHost.prototype._readFile = function _readFile(filename) {
  var readFile = Promise.promisify(this.fs.readFile.bind(this.fs));
  return readFile(filename).then(function(buf) {
    return buf.toString('utf8');
  });
};

TypeScriptWebpackHost.prototype.addFile = function addFile(filename) {
  return this._readFile(filename).then(this._addFile.bind(this, filename));
};

/**
 * Emit compilation result for a specified filename.
 */
TypeScriptWebpackHost.prototype.emit = function emit(resolver, filename, text) {
  this._addFile(filename, text);

  var result = Promise.resolve();

  var libFilename = this.getDefaultLibFilename();
  if (this.files[libFilename] === undefined) {
    result = result.then(function() {
      return this.addFile(libFilename);
    }.bind(this));
  }

  var dependencies = this.findImportDeclarations(filename);
  dependencies = dependencies.map(function(dep) {
    return resolver(path.dirname(filename), dep).then(this.addFile.bind(this));
  }, this);
  result = result.then(function() { return Promise.all(dependencies); });

  return result.then(function() {
    var output = this.services.getEmitOutput(filename);
    if (output.emitOutputStatus === ts.EmitReturnStatus.Succeeded) {
      return output;
    } else {
      var diagnostics = this.services
        .getCompilerOptionsDiagnostics()
        .concat(this.services.getSyntacticDiagnostics(filename))
        .concat(this.services.getSemanticDiagnostics(filename));
      throw new TypeScriptCompilationError(diagnostics);
    }
  }.bind(this));
};

function TypeScriptCompilationError(diagnostics) {
  this.diagnostics = diagnostics;
}
util.inherits(TypeScriptCompilationError, Error);

module.exports = TypeScriptWebpackHost;
module.exports.TypeScriptCompilationError = TypeScriptCompilationError;
