/// <reference path="typings/tsd.d.ts" />

require('./index.css');

import React = require('react/addons');
import Button = require('./Button');
import AsyncComponent = require('./AsyncComponent');

var App = React.createClass({

  render() {
    return React.DOM.div({},
      React.createElement(Button, {}),
      this.state.async ? React.createElement(this.state.async, {}) : null
    );
  },

  getInitialState() {
    return {async: null};
  },

  componentDidMount() {
    require.ensure(['./AsyncComponent'], (require) => {
      var async: typeof AsyncComponent = require('./AsyncComponent');
      this.setState({async: async});
    });
  }
});

React.render(
  React.createElement(App, {}),
  document.getElementById('main'));
