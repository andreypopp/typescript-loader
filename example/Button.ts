/// <reference path="typings/react/react.d.ts" />

import React = require('react');

export var Button = React.createClass({

  render() {
    return React.DOM.button({onClick: this.onClick}, 'Typed Button!');
  },

  onClick(e) {
    alert('Works!');
  }
});
