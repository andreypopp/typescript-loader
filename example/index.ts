/// <reference path="typings/react/react.d.ts" />
import hw = require("./helloworld");
import React = require('react');

var x = React.createElement('div', {});

var hwo = new hw.helloworld_module.HelloWorld('asdasd');
hwo.sayit();
