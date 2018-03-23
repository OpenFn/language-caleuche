'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.each = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module Adaptor */


exports.execute = execute;
exports.driver = driver;
exports.wait = wait;
exports.url = url;
exports.elementById = elementById;
exports.type = type;
exports.elementClick = elementClick;
exports.imageClick = imageClick;
exports.ocr = ocr;

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

  var chromeCapabilities = webdriver.Capabilities.chrome();
  chromeCapabilities.set('chromeOptions', {
    'args': ['--headless']
  }).set('acceptInsecureCerts', true);

  var driver = new webdriver.Builder().forBrowser('chrome').withCapabilities(chromeCapabilities).build();

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
    state.driver = driver;
    state.By = _seleniumWebdriver.By;
    state.promise = _seleniumWebdriver.promise;
    state.until = _seleniumWebdriver.until;
    return _languageCommon.execute.apply(undefined, operations.concat([cleanupState]))(_extends({}, initialState, state));
  };
}

function cleanupState(state) {
  if (state.driver) {
    (0, _Utils.screenshot)(state.driver, 'tmp/img/finalScreen.png');
    state.driver.quit();
    delete state.driver;
  }
  delete state.By;
  delete state.Key;
  delete state.promise;
  delete state.until;
  delete state.element;
  return state;
}

/**
 * Runs a function with access to state and the webdriver.
 * @public
 * @example
 *  driver(callback)
 * @function
 * @param {Function} func is the function
 * @returns {<Operation>}
 */
function driver(func) {
  return function (state) {
    return func(state);
  };
}

function wait(ms) {
  return function (state) {
    return new Promise(function (resolve) {
      return setTimeout(function () {
        return resolve(state);
      }, ms);
    }).then(function (data) {
      return state;
    });
  };
}

function url(url) {
  return function (state) {
    return state.driver.get(url).then(function (data) {
      return (0, _languageCommon.composeNextState)(state, data);
    });
  };
}

function elementById(id, timeout) {
  return function (state) {
    return state.driver.wait(_seleniumWebdriver.until.elementLocated(_seleniumWebdriver.By.id(id)), 25 * 1000).then(function (element) {
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
      return (0, _languageCommon.composeNextState)(state, data);
    });
  };
}

function elementClick() {
  return function (state) {
    return state.element.click().then(function (data) {
      return (0, _languageCommon.composeNextState)(state, data);
    });
  };
}

function imageClick(type, needle) {
  return function (state) {
    return (0, _promiseRetry2.default)({ factor: 1, maxTimeout: 1000 }, function (retry, number) {
      console.log("try number " + number);
      return state.driver.takeScreenshot().then(function (haystack, err) {
        return (0, _OpenCV.findInImage)((0, _Utils.getPath)(state, needle), haystack).catch(retry);
      });
    }).then(function (_ref) {
      var target = _ref.target,
          minMax = _ref.minMax;

      console.log("Match Found: " + JSON.stringify(minMax));
      if (type == 'double') {
        return (0, _Utils.doubleClick)(state, target);
      } else {
        return (0, _Utils.singleClick)(state, target);
      }
    }).then(function (data) {
      return (0, _languageCommon.composeNextState)(state, data);
    });
  };
}

// export function press(key) {
//   return state => {
//     return state.element.sendKeys(Key.RETURN).then((data) => {
//       return composeNextState(state, data)
//     })
//   }
// }

function ocr(image, x, y, X, Y) {
  return function (state) {
    console.log((0, _Utils.getPath)(state, image));
    (0, _OCR.readText)((0, _Utils.getPath)(state, image));
    return (0, _languageCommon.composeNextState)(state, data);
  };
}
