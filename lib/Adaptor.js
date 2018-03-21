'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.each = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module Adaptor */


exports.execute = execute;
exports.url = url;
exports.elementById = elementById;
exports.type = type;
exports.click = click;
exports.wait = wait;
exports.find = find;
exports.matchTemplate = matchTemplate;
exports.ocr = ocr;
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

var _fs = require('fs');

var _util = require('util');

var _seleniumWebdriver = require('selenium-webdriver');

var _firefox = require('selenium-webdriver/firefox');

var _firefox2 = _interopRequireDefault(_firefox);

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

  // require('chromedriver');
  // var webdriver = require('selenium-webdriver');
  // var driver = new webdriver.Builder()
  //   .forBrowser('chrome')
  //   .build();

  var initialState = {
    references: [],
    data: null
    // driver
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, operations.concat([cleanupState]))(_extends({}, initialState, state));
  };
}

function cleanupState(state) {
  // state.driver.quit();
  delete state.driver;
  delete state.element;
  return state;
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

function click() {
  return function (state) {
    return state.element.click().then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return state;
    });
  };
}

function wait(timeout) {
  return function (state) {
    return setTimeout(function () {
      console.log("hi mom");
    }, 1500).then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return state;
    });
  };
}

function find(image) {
  return function (state) {
    // screenshot(state.driver)
    return matchTemplate(state, image, "out.png").then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return state;
    });
  };
};

function matchTemplate(state, small, big) {
  var sPath = './' + state.path_to_images + '/' + small;
  var bPath = './' + state.path_to_images + '/' + big;
  var cv = require('opencv');
  // console.log(cv.IMREAD_COLOR);
  // cv.readImage(bPath);
  var image = cv.readImage(bPath, function (err, mat) {
    return mat;
  });
  console.log(image);
  var templ = cv.readImage(sPath, function (err, mat) {
    console.log(mat);
    return mat;
  });
  console.log(templ);
  // const method = cv.TM_SQDIFF;
  // const output = cv.matchTemplate(templ, method, img);
  // return new Promise( ( resolve, reject ) => {
  //   const image = cv.readImage( bPath, ( err, matrix ) => err ? reject( err ) : resolve( matrix ) );
  // })
  // return new Promise( ( resolve, reject ) => {
  //   const templ = cv.readImage( sPath, ( err, matrix ) => err ? reject( err ) : resolve( matrix ) );
  // })
  output = image.matchTemplateByMatrix(templ, 3);
  var hoop_match = output.templateMatches(0.8, 1.0, 1);
  console.log(hoop_match);
  //
  // cv.readImage(bPath, function(err, im) {
  //   if (err) return console.error('error loading image');
  //   var output = im.matchTemplate(bPath, 3);
  //   var matches = output.templateMatches(0.80, 1.0, 5, false);
  //   console.log(matches);
  // })
}

function screenshot(driver) {
  driver.takeScreenshot().then(function (image, err) {
    require('fs').writeFile('tmp/img/out.png', image, 'base64', function (err) {
      console.log(err);
    });
  });
}

function ocr(x, y, w, h) {
  request.post(google.vision.com).then(blah);
}

function doubleClick(element, location) {
  return function (state) {
    var act = new Actions(state.driver);
    return (elem ? act.moveToElement(element).moveByOffset(10, 20).doubleClick().perform() : state.element.doubleClick()).then(function (data) {
      var nextState = (0, _languageCommon.composeNextState)(state, data);
      return state;
    });
  };
}
