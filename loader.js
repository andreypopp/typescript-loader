/**
 * @copyright 2015, Andrey Popp <me@andreypopp.com>
 */
'use strict';

var Promise = require('bluebird');

function typescriptLoader(text) {
  if (this.cacheable) {
    this.cacheable();
  }
  var cb = this.async();
  var filename = this.resourcePath;
  var resolver = Promise.promisify(this.resolve);
  this._compiler.typeScriptPlugin.emit(resolver, filename, text, function(err, result) {
    if (err) {
      return cb(err);
    }
    if (result.output) {
      for (var i = 0; i < result.output.outputFiles.length; i++) {
        var o = result.output.outputFiles[i];
        // tsc mangles filenames by replacing .ts to .js
        if (o.name.replace(/\.js$/, '.ts') === filename) {
          return cb(null, o.text);
        }
      }
      return cb(new Error('no output found for ' + filename));
    } else if (result.errors) {
      var errors = formatErrors(result.errors);
      errors.forEach(this.emitError, this);
      cb(null, errors
        .map(function(error) { return 'console.error(' + JSON.stringify(error) + ');'; })
        .join('\n'));
    }
  }.bind(this));

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
