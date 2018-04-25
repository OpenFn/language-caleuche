'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.each = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module Adaptor */


exports.execute = execute;
exports.driver = driver;
exports.conditional = conditional;
exports.wait = wait;
exports.url = url;
exports.elementById = elementById;
exports.elementByCss = elementByCss;
exports.type = type;
exports.huntAndPeck = huntAndPeck;
exports.chord = chord;
exports.setDelay = setDelay;
exports.assertVisible = assertVisible;
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
    'args': ['--headless', '--window-size=1080,1080', '--no-gpu']
  }).set('acceptInsecureCerts', true);

  var driver = new webdriver.Builder().forBrowser('chrome').withCapabilities(chromeCapabilities).build();

  var initialState = {
    references: [],
    data: null,
    delay: 0,
    driver: driver,
    By: _seleniumWebdriver.By,
    Key: _seleniumWebdriver.Key,
    promise: _seleniumWebdriver.promise,
    until: _seleniumWebdriver.until
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, operations.concat([cleanupState]))(_extends({}, initialState, state)).catch(function (e) {
      driver.quit();
      throw e;
    });
  };
}

function cleanupState(state) {
  if (state.driver) {
    (0, _Utils.screenshot)(state.driver, 'tmp/final_screen.png');
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

    function wrapper(boolean) {
      return new Promise(function (resolve, reject) {
        boolean ? resolve() : reject();
      });
    }

    return (typeof test == 'boolean' ? wrapper(test) : test(state)).then(function () {
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
    console.log('Waiting for ' + ms + 'ms...');
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve();
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
    return state.driver.wait(_seleniumWebdriver.until.elementLocated(_seleniumWebdriver.By.id(id)), timeout || 25 * 1000).then(function (element) {
      return _extends({}, state, { element: element });
    });
  };
}

function elementByCss(id, timeout) {
  return function (state) {
    return state.driver.wait(_seleniumWebdriver.until.elementLocated(_seleniumWebdriver.By.css(id)), timeout || 25 * 1000).then(function (element) {
      return _extends({}, state, { element: element });
    });
  };
}

function type(keys) {
  return function (state) {

    var array = typeof keys == 'string' ? [keys] : keys;
    console.log("typing: " + (0, _Utils.parseKeys)(state, array));

    // return state.element.sendKeys(
    return state.driver.actions().sendKeys((0, _Utils.parseKeys)(state, array)).perform().then(sleep(state.delay)).then(function () {
      return state;
    });
  };
}

function huntAndPeck(keys) {
  return function (state) {

    var array = keys.split('');
    console.log("slowly hunting and pecking: " + (0, _Utils.parseKeys)(state, array));

    var operations = array.map(function (key) {
      return type(key);
    });

    var start = Promise.resolve(state);

    return operations.reduce(function (acc, operation) {
      return acc.then(operation);
    }, start);
  };
}

function chord(keys) {
  return function (state) {

    console.log("chording: " + (0, _Utils.parseKeys)(state, keys));

    // NOTE: `return state.element.sendKeys(...)` is another option here.
    // Decided on sending to the driver as it does not requre an element.
    return state.driver.actions().sendKeys(state.Key.chord((0, _Utils.parseKeys)(state, keys))).perform().then(sleep(state.delay)).then(function () {
      return state;
    });
  };
}

function searchArray(state, input, timeout) {
  var imageArray = (typeof input === 'undefined' ? 'undefined' : _typeof(input)) == 'object' ? input : [input];
  return imageArray.map(function (img) {
    return search(state, (0, _Utils.getPath)(state, img), timeout);
  });
}

function setDelay(ms) {
  return function (state) {
    state.delay = ms;
    return state;
  };
}

function sleep(ms) {
  return function (state) {
    return new Promise(function (resolve) {
      return setTimeout(function () {
        return resolve(state);
      }, ms);
    });
  };
}

function assertVisible(needle, timeout) {
  return function (state) {
    return Promise.race(searchArray(state, needle, timeout)).then(function () {
      return state;
    });
  };
}

/**
 * clicks on an element or a location offset within an element/canvas
 * @public
 * @example
 *  click('single', 'happy_face.png', 4000)
 * @function
 * @param {string} type is either 'single' or 'double'
 * @param {string} needle is the image to search for on the screen/canvas
 * @param {integer} timeout is the image to search for on the screen/canvas
 * @returns {<Operation>}
 */
function click(type, needle, timeout) {
  return function (state) {

    if (!needle) {

      return state.element.click().then(function () {
        return type == 'double' && state.element.click();
      }).then(sleep(state.delay)).then(function () {
        return state;
      });
    } else {

      return Promise.race(searchArray(state, needle, timeout)).then(function (_ref) {
        var target = _ref.target,
            minMax = _ref.minMax;

        (0, _Utils.offsetClick)(state, target);
        return target;
      }).then(function (target) {
        return type == 'double' && (0, _Utils.offsetClick)(state, target);
      }).then(sleep(state.delay)).then(function () {
        return state;
      });
    }
  };
}

function search(state, image, timeout) {

  console.log('Searching for ' + image + '...');

  var options = {
    retries: timeout ? timeout * 2 / 1000 : 10, // The maximum amount of times to retry the operation. Default is 10.
    factor: 2, // The exponential factor to use. Default is 2.
    minTimeout: 500, // The number of milliseconds before starting the first retry. Default is 1000.
    maxTimeout: 1000, // The maximum number of milliseconds between two retries. Default is Infinity.
    randomize: false // Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is false.
  };

  return (0, _promiseRetry2.default)(options, function (retry, number) {
    return state.driver.takeScreenshot().then(function (haystack, err) {
      return (0, _OpenCV.findInImage)((0, _Utils.base64_encode)(image), haystack);
    }).catch(retry);
  }).then(function (_ref2) {
    var target = _ref2.target,
        minMax = _ref2.minMax;

    console.log('Found: ' + image + '.');
    return { target: target, minMax: minMax };
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

      return search(state, anchorImage).then(function (_ref4) {
        var target = _ref4.target;

        var xPos = target.x + offsetX;
        var yPos = target.y + offsetY;
        return state.driver.takeScreenshot().then(function (fullScreen) {
          return (0, _OpenCV.cropImage)(fullScreen, xPos, yPos, width, height);
        });
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
