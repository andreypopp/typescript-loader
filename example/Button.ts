import React = require('react');

export var Button = React.createClass({

  render() {
    return React.DOM.button({onClick: this.onClick}, 'Typed Button!');
  },

  componentDidMount() {
    throw new Error('xx');
  },

  onClick(e) {
    alert('Works!');
  }
});
