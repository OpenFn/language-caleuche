'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.each = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module Adaptor */


exports.execute = execute;
exports.driver = driver;
exports.conditional = conditional;
exports.wait = wait;
exports.url = url;
exports.elementById = elementById;
exports.type = type;
exports.visible = visible;
exports.click = click;
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

var _util = require('util');

var _seleniumWebdriver = require('selenium-webdriver');

var _promiseRetry = require('promise-retry');

var _promiseRetry2 = _interopRequireDefault(_promiseRetry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    // 'args': ['--headless']
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

function conditional(test, funTrue, funFalse) {
  return function (state) {
    return test(state).then(function () {
      return funTrue(state);
    }).catch(function () {
      if (funFalse) {
        return funFalse(state);
      } else {
        return state;
      }
    });
  };
}

function wait(ms) {
  return function (state) {
    return new Promise(function (resolve) {
      return setTimeout(function () {
        return resolve(state);
      }, ms);
    }).then(function () {
      return state;
    });
  };
}

function url(url) {
  return function (state) {
    return state.driver.get(url).then(function () {
      return state;
    });
  };
}

function elementById(id, timeout) {
  return function (state) {
    return state.driver.wait(_seleniumWebdriver.until.elementLocated(_seleniumWebdriver.By.id(id)), 25 * 1000).then(function (element) {
      return _extends({}, state, { element: element });
    });
  };
}

function type(text) {
  return function (state) {
    return state.element.sendKeys(text).then(function () {
      return state;
    });
  };
}

function visible(needle) {
  return function (state) {
    return (0, _promiseRetry2.default)({ factor: 1, maxTimeout: 1000 }, function (retry, number) {
      console.log('trying ' + needle + ': ' + number);
      return state.driver.takeScreenshot().then(function (haystack, err) {
        return (0, _OpenCV.findInImage)((0, _Utils.getPath)(state, needle), haystack).catch(retry);
      });
    });
  };
}

/**
 * clicks on an element or a location offset within an element/canvas
 * @public
 * @example
 *  click('single', 'happy_face.png')
 * @function
 * @param {type} type is either 'single' or 'double'
 * @param {needle} needle is the image to search for on the screen/canvas
 * @returns {<Operation>}
 */
function click(type, needle) {
  return function (state) {

    if (!needle) {

      return state.element.click().then(function () {
        return type == 'double' && state.element.click();
      }).then(function () {
        return state;
      });
    } else {

      return (0, _promiseRetry2.default)({ factor: 1, maxTimeout: 1000 }, function (retry, number) {
        console.log('trying ' + needle + ': ' + number);
        return state.driver.takeScreenshot().then(function (haystack, err) {
          return (0, _OpenCV.findInImage)((0, _Utils.getPath)(state, needle), haystack).catch(retry);
        });
      }).then(function (_ref) {
        var target = _ref.target,
            minMax = _ref.minMax;

        console.log("Match Found: " + JSON.stringify(minMax));
        (0, _Utils.offsetClick)(state, target);
        return target;
      }).then(function (target) {
        return type == 'double' && (0, _Utils.offsetClick)(state, target);
      }).then(function () {
        return state;
      });
    }
  };
}

function tryToFind(state, image) {
  return (0, _promiseRetry2.default)({ factor: 1, maxTimeout: 1000 }, function (retry, number) {
    console.log('trying ' + image + ': ' + number);
    return state.driver.takeScreenshot().then(function (haystack, err) {
      return (0, _OpenCV.findInImage)((0, _Utils.base64_encode)(image), haystack).catch(retry);
    });
  }).then(function (_ref2) {
    var target = _ref2.target,
        minMax = _ref2.minMax;

    console.log("Match Found: " + JSON.stringify(minMax));
    return target;
  });
}

function ocr(_ref3) {
  var label = _ref3.label,
      image = _ref3.image,
      authKey = _ref3.authKey,
      offsetX = _ref3.offsetX,
      offsetY = _ref3.offsetY,
      width = _ref3.width,
      height = _ref3.height,
      mock = _ref3.mock;

  return function (state) {
    var data = {};
    if (mock) {

      data[label] = "OCR mocked, results go here.";
      return (0, _languageCommon.composeNextState)(state, data);
    } else {

      var anchorImage = (0, _Utils.getPath)(state, image);

      return tryToFind(state, anchorImage).then(function (target) {
        return state.driver.takeScreenshot();
      }).then(function (fullScreen) {
        return (0, _OpenCV.cropImage)(fullScreen, offsetX, offsetY, width, height);
      }).then(function (imageToRead) {
        return (0, _OCR.readText)(imageToRead, authKey);
      }).then(function (results) {
        var fullTextAnnotation = results.responses[0].fullTextAnnotation.text;
        data[label] = fullTextAnnotation;
        console.log(data);
        return (0, _languageCommon.composeNextState)(state, data);
      });
    }
  };
};
