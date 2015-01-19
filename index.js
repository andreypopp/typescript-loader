/**
 * @copyright 2015, Andrey Popp <me@andreypopp.com>
 */
'use strict';

var Promise               = require('bluebird');
var TypeScriptWebpackHost = require('./TypeScriptWebpackHost');
var loaderUtils           = require('loader-utils');

function typescriptLoader(text) {
  if (this.cacheable) {
    this.cacheable();
  }
  var cb = this.async();
  var filename = this.resourcePath;
  var resolver = Promise.promisify(this.resolve);

  if (this._compiler.typeScriptWebpackHost === undefined) {
    var options = loaderUtils.parseQuery(this.query);
    this._compiler.typeScriptWebpackHost = new TypeScriptWebpackHost(
      options,
      this._compiler.inputFileSystem
    );
  }

  this._compiler.typeScriptWebpackHost.emit(resolver, filename, text)
    .then(function(output) {
      for (var i = 0; i < output.outputFiles.length; i++) {
        var o = output.outputFiles[i];
        // tsc mangles filenames by replacing .ts to .js
        if (o.name.replace(/\.js$/, '.ts') === filename) {
          return o.text;
        }
      }
      throw new Error('no output found for ' + filename);
    }.bind(this))
    .catch(TypeScriptWebpackHost.TypeScriptCompilationError, function(err) {
      var errors = formatErrors(err.diagnostics);
      errors.forEach(this.emitError, this);
      return codegenErrorReport(errors);
    }.bind(this))
    .then(cb.bind(null, null), cb);
}

function codegenErrorReport(errors) {
  return errors
    .map(function(error) {
      return 'console.error(' + JSON.stringify(error) + ');';
    })
    .join('\n');
}

function formatErrors(errors) {
  return errors.map(function(diagnostic) {
    var lineChar;
    if (diagnostic.file) {
      lineChar = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
    }
    return (
      (diagnostic.file ? diagnostic.file.filename + ' ' : '')
      + (lineChar ? formatLineChar(lineChar) + ' ': '')
      + diagnostic.messageText
    );
  });
}

function formatLineChar(lineChar) {
  return '(' + lineChar.line + ', ' + lineChar.character + ')';
}

module.exports = typescriptLoader;
