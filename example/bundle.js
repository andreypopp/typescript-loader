/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var hw = __webpack_require__(1);
	var hwo = new hw.helloworld_module.HelloWorld('world');
	hwo.sayit();


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var helloworld_module;
	(function (helloworld_module) {
	    var HelloWorld = (function () {
	        function HelloWorld(word) {
	            if (word === void 0) { word = "serif"; }
	            this.word = word;
	        }
	        HelloWorld.prototype.sayit = function () {
	            console.log('Hello ' + this.word);
	        };
	        return HelloWorld;
	    })();
	    helloworld_module.HelloWorld = HelloWorld;
	})(helloworld_module = exports.helloworld_module || (exports.helloworld_module = {}));


/***/ }
/******/ ])