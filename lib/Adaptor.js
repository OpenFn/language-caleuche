'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.commonExecute = exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.each = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module Adaptor */


exports.execute = execute;
exports.driver = driver;
exports.conditional = conditional;
exports.wait = wait;
exports.url = url;
exports.elementById = elementById;
exports.elementByCss = elementByCss;
exports.elementByXPath = elementByXPath;
exports.elementByName = elementByName;
exports.type = type;
exports.typeInElement = typeInElement;
exports.huntAndPeck = huntAndPeck;
exports.chord = chord;
exports.setDelay = setDelay;
exports.setConfidence = setConfidence;
exports.pushOptions = pushOptions;
exports.assertVisible = assertVisible;
exports.click = click;
exports.ocr = ocr;
exports.printScreen = printScreen;

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
Object.defineProperty(exports, 'commonExecute', {
  enumerable: true,
  get: function get() {
    return _languageCommon.execute;
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
    'args': ['--headless', '--no-gpu', '--window-size=1920,1080', '--lang=es']
  }).set('acceptInsecureCerts', true);

  var driver = new webdriver.Builder().forBrowser('chrome').withCapabilities(chromeCapabilities).build();

  var initialState = {
    references: [],
    data: null,
    options: {
      delay: 0,
      confidence: 0.95,
      retries: 10
    },
    driver: driver,
    By: _seleniumWebdriver.By,
    Key: _seleniumWebdriver.Key,
    promise: _seleniumWebdriver.promise,
    until: _seleniumWebdriver.until
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, operations.concat([cleanupState]))(_extends({}, initialState, state)).catch(function (e) {
      (0, _Utils.screenshot)(driver, 'tmp/error.png');
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

function elementByCss(className, timeout) {
  return function (state) {
    return state.driver.wait(_seleniumWebdriver.until.elementLocated(_seleniumWebdriver.By.css(className)), timeout || 25 * 1000).then(function (element) {
      return _extends({}, state, { element: element });
    });
  };
}

function elementByXPath(id, timeout) {
  return function (state) {
    return state.driver.wait(_seleniumWebdriver.until.elementLocated(_seleniumWebdriver.By.xpath(id)), timeout || 25 * 1000).then(function (element) {
      return _extends({}, state, { element: element });
    });
  };
}

function elementByName(name, timeout) {
  return function (state) {
    return state.driver.wait(_seleniumWebdriver.until.elementLocated(_seleniumWebdriver.By.name(name)), timeout || 25 * 1000).then(function (element) {
      return _extends({}, state, { element: element });
    });
  };
}

function type(keys) {
  return function (state) {

    var array = typeof keys == 'string' ? [keys] : keys;
    console.log("Typing: " + (0, _Utils.parseKeys)(state, array));
    return state.driver.actions().sendKeys((0, _Utils.parseKeys)(state, array)).perform().then(sleep(state.options.delay)).then(function () {
      return state;
    });
  };
}

function typeInElement(keys) {
  return function (state) {
    var array = typeof keys == 'string' ? [keys] : keys;
    console.log("Typing: " + (0, _Utils.parseKeys)(state, array));
    return state.element.sendKeys((0, _Utils.parseKeys)(state, array)).then(sleep(state.options.delay)).then(function () {
      return state;
    });
  };
}

function shiftCase(key) {
  if (isNaN(key) && key.toUpperCase() === key) {
    return chord(['Key.SHIFT', key]);
  }
  return type(key);
}

function huntAndPeck(keys, options) {
  return function (state) {
    var array = keys.split('');
    console.log('Sending each character to Selenium individually: ' + (0, _Utils.parseKeys)(state, array));
    var operations = array.map(function (key) {
      if (options.manualCase) {
        return shiftCase(key);
      }
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

    console.log('Chording: ' + (0, _Utils.parseKeys)(state, keys));

    // NOTE: `return state.element.sendKeys(...)` is another option here.
    // Decided on sending to the driver as it does not requre an element.
    return state.driver.actions().sendKeys(state.Key.chord((0, _Utils.parseKeys)(state, keys))).perform().then(sleep(state.options.delay)).then(function () {
      return state;
    });
  };
}

function searchArray(state, input, timeout, confidence) {
  var imageArray = (typeof input === 'undefined' ? 'undefined' : _typeof(input)) == 'object' ? input : [input];
  return imageArray.map(function (img) {
    return search(state, (0, _Utils.getPath)(state, img), timeout, confidence);
  });
}

function setDelay(ms) {
  return function (state) {
    state.options.delay = ms;
    return state;
  };
}

function setConfidence(float) {
  return function (state) {
    state.options.confidence = float;
    return state;
  };
}

function pushOptions(obj) {
  return function (state) {
    state.options = _extends({}, state.options, obj);
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

function assertVisible(needle, options) {
  return function (state) {
    var _ref = options || {},
        timeout = _ref.timeout,
        confidence = _ref.confidence;

    console.log('Searching for: ' + needle);
    return Promise.race(searchArray(state, needle, timeout, confidence)).then(function () {
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
 * @param {object} options contains the timeout and confidence, optionally
 * @returns {<Operation>}
 */
function click(type, needle, options) {
  return function (state) {
    var _ref2 = options || {},
        timeout = _ref2.timeout,
        confidence = _ref2.confidence;

    console.log('Attempting to ' + type + ' click on: ' + needle);
    if (!needle) {
      return state.element.click().then(function () {
        return type == 'double' && state.element.click();
      }).then(sleep(state.options.delay)).then(function () {
        return state;
      });
    } else {
      return Promise.race(searchArray(state, needle, timeout, confidence)).then(function (_ref3) {
        var target = _ref3.target,
            minMax = _ref3.minMax;

        (0, _Utils.offsetClick)(state, target);
        return target;
      }).then(function (target) {
        return type == 'double' && (0, _Utils.offsetClick)(state, target);
      }).then(sleep(state.options.delay)).then(function () {
        return state;
      });
    }
  };
}

function search(state, image, timeout, confidence) {
  var options = {
    retries: timeout ? timeout * 2 / 1000 : state.options.retries, // The maximum amount of times to retry the operation. Default is 10.
    factor: 2, // The exponential factor to use. Default is 2.
    minTimeout: 500, // The number of milliseconds before starting the first retry. Default is 1000.
    maxTimeout: 1000, // The maximum number of milliseconds between two retries. Default is Infinity.
    randomize: false // Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is false.
  };

  return (0, _promiseRetry2.default)(options, function (retry, number) {
    return state.driver.takeScreenshot().then(function (haystack, err) {
      return (0, _OpenCV.findInImage)((0, _Utils.base64_encode)(image), haystack, confidence || state.options.confidence);
    }).catch(retry);
  }).then(function (_ref4) {
    var target = _ref4.target,
        minMax = _ref4.minMax;

    console.log('Found: ' + image + '.');
    return { target: target, minMax: minMax };
  });
}

function ocr(_ref5) {
  var label = _ref5.label,
      image = _ref5.image,
      authKey = _ref5.authKey,
      offsetX = _ref5.offsetX,
      offsetY = _ref5.offsetY,
      width = _ref5.width,
      height = _ref5.height,
      mock = _ref5.mock;

  return function (state) {
    var data = {};
    if (mock) {

      data[label] = "OCR mocked, results go here.";
      return (0, _languageCommon.composeNextState)(state, data);
    } else {

      var anchorImage = (0, _Utils.getPath)(state, image);

      return search(state, anchorImage).then(function (_ref6) {
        var target = _ref6.target;

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

function printScreen(output) {
  return function (state) {
    (0, _Utils.screenshot)(state.driver, 'tmp/' + output);
    return state;
  };
}
