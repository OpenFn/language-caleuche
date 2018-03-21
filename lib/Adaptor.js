'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.each = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module Adaptor */


exports.execute = execute;
exports.driver = driver;
exports.url = url;
exports.elementById = elementById;
exports.type = type;
exports.elementClick = elementClick;
exports.imageClick = imageClick;
exports.imageDoubleClick = imageDoubleClick;
exports.doubleClick = doubleClick;

var _languageCommon = require('language-common');

Object.defineProperty(exports, 'field', {
  enumerable: true,
  get: function get() {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, 'fields', {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, 'sourceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});
Object.defineProperty(exports, 'alterState', {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, 'each', {
  enumerable: true,
  get: function get() {
    return _languageCommon.each;
  }
});
Object.defineProperty(exports, 'merge', {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, 'dataPath', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, 'dataValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, 'lastReferenceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});

var _OpenCV = require('./OpenCV');

var _OCR = require('./OCR');

var _Utils = require('./Utils');

var _fs = require('fs');

var _util = require('util');

var _seleniumWebdriver = require('selenium-webdriver');

var _firefox = require('selenium-webdriver/firefox');

var _firefox2 = _interopRequireDefault(_firefox);

var _promiseRetry = require('promise-retry');

var _promiseRetry2 = _interopRequireDefault(_promiseRetry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * Execute a sequence of operations.
 * Wraps `language-common/execute`, and prepends initial state for http.
 * @example
 * execute(
 *   create('foo'),
 *   delete('bar')
 * )(state)
 * @function
 * @param {Operations} operations - Operations to be performed.
 * @returns {Operation}
 */
function execute() {
  for (var _len = arguments.length, operations = Array(_len), _key = 0; _key < _len; _key++) {
    operations[_key] = arguments[_key];
  }

  require('chromedriver');
  var webdriver = require('selenium-webdriver');
  var driver = new webdriver.Builder().forBrowser('chrome').build();

  var initialState = {
    references: [],
    data: null,
    driver: driver,
    By: _seleniumWebdriver.By,
    Key: _seleniumWebdriver.Key,
    promise: _seleniumWebdriver.promise,
    until: _seleniumWebdriver.until
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, operations.concat([cleanupState]))(_extends({}, initialState, state));
  };
}

function cleanupState(state) {
  // screenshot(state.driver, 'tmp/img/finalScreen.png')
  // state.driver.quit();
  delete state.driver;
  delete state.By;
  delete state.Key;
  delete state.promise;
  delete state.until;
  delete state.element;
  return state;
}

/**
 * Runs a function using state.
 * @public
 * @example
 *  alterState(callback)
 * @function
 * @param {Function} func is the function
 * @returns {<Operation>}
 */
function driver(func) {
  return function (state) {
    return func(state);
  };
}

function url(url) {
  return function (state) {
    return state.driver.get(url).then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return nextState;
    });
  };
}

function elementById(id, timeout) {
  return function (state) {
    return state.driver.wait(_seleniumWebdriver.until.elementLocated(_seleniumWebdriver.By.id(id)), 15 * 1000).then(function (element) {
      return _extends({}, state, {
        element: element,
        references: [].concat(_toConsumableArray(state.references), [state.data])
      });
    });
  };
}

function type(text) {
  return function (state) {
    return state.element.sendKeys(text).then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return state;
    });
  };
}

function elementClick() {
  return function (state) {
    return state.element.click().then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return state;
    });
  };
}

// TODO: Refactor into a single function with click options ====================
function imageClick(needle) {
  return function (state) {

    return (0, _promiseRetry2.default)({ factor: 1, maxTimeout: 1000 }, function (retry, number) {
      console.log('attempt number', number);
      return state.driver.takeScreenshot().then(function (haystack, err) {
        return (0, _OpenCV.findInImage)((0, _Utils.getPath)(state, needle), haystack).catch(retry);
      });
    }).then(function (targetPos) {
      // console.log(targetPos);
      state.driver.actions().mouseMove(state.element, targetPos).click().perform();
    }).then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return state;
    });
  };
}

function imageDoubleClick(needle) {
  return function (state) {

    return (0, _promiseRetry2.default)({ factor: 1, maxTimeout: 1000 }, function (retry, number) {
      console.log('attempt number', number);
      return state.driver.takeScreenshot().then(function (haystack, err) {
        return (0, _OpenCV.findInImage)((0, _Utils.getPath)(state, needle), haystack).catch(retry);
      });
    }).then(function (targetPos) {
      console.log(targetPos);
      state.driver.actions().mouseMove(state.element, targetPos).click().doubleClick().perform();
    }).then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return state;
    });
  };
}
// =============================================================================

// TODO: implement integer wait...
// export function wait(timeout) {
//   return state => {
//     return setTimeout(function() {
//       console.log("hi mom")
//     }, 1500).then((data) => {
//       const nextState = composeNextState(state, data)
//       return state;
//     })
//   }
// }

// export function find(image) {
//   return state => {
//     return findInImage(getPath(state, image), getPath(state, "screen.png"))
//   }
// };

function doubleClick(element, location) {
  return function (state) {
    var act = new Actions(state.driver);
    return (elem ? act.moveToElement(element).moveByOffset(10, 20).doubleClick().perform() : state.element.doubleClick()).then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return state;
    });
  };
}
