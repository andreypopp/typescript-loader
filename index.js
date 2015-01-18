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

  var libFilename = this.getDefaultLibFilename();
  this._addFile(libFilename, fs.readFileSync(libFilename, 'utf8'));
}

TypeScriptPlugin.prototype.apply = function apply(compiler) {
  compiler.typeScriptPlugin = this;
};

TypeScriptPlugin.prototype.getScriptFileNames = function getScriptFileNames() {
  return Object.keys(this.files);
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

/**
 * Return an array of import declarations found in source file.
 */
TypeScriptPlugin.prototype.findImportDeclarations = function findImportDeclarations(filename) {
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

TypeScriptPlugin.prototype._addFile = function _addFile(filename, text) {
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
  this._addFile(filename, text);

  var result = Promise.resolve();
  var dependencies = this.findImportDeclarations(filename);

  result = result
    .then(function() {
      return Promise.all(dependencies.map(function(dep) {
        return resolver(path.dirname(filename), dep).then(function(filename) {
          return readFile(filename, 'utf8').then(function(text) {
            return {text: text, filename: filename};
          });
        });
      }));
    })
    .then(function(deps) {
      deps.forEach(function(dep) {
        this._addFile(dep.filename, dep.text);
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
};

module.exports = TypeScriptPlugin;
