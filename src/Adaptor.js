/** @module Adaptor */
import {execute as commonExecute, expandReferences, composeNextState} from 'language-common';
import {findInImage} from './OpenCV';
import {readText} from './OCR'
import {screenshot, getPath, singleClick, doubleClick} from './Utils';
import {writeFile} from 'fs';
import {promisify} from 'util';
import {Builder, By, Key, promise, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox';
import promiseRetry from 'promise-retry';

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
export function execute(...operations) {

  require('chromedriver');
  require('geckodriver');

  var webdriver = require('selenium-webdriver');

  const chromeCapabilities = webdriver.Capabilities.chrome();
  chromeCapabilities
  .set('chromeOptions', {
    // 'args': ['--headless']
  })
  .set('acceptInsecureCerts', true)

  const driver = new webdriver.Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .build();

  const initialState = {
    references: [],
    data: null,
    driver,
    By,
    Key,
    promise,
    until
  }

  return state => {
    state.driver = driver;
    state.By = By;
    state.promise = promise;
    state.until = until;
    return commonExecute(...operations, cleanupState)({...initialState, ...state})
  };

}

function cleanupState(state) {
  if (state.driver) {
    screenshot(state.driver, 'tmp/img/finalScreen.png')
    // state.driver.quit();
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
export function driver(func) {
  return state => {
    return func(state)
  }
}

export function url(url) {
  return state => {
    return state.driver.get(url).then((data) => {
      return composeNextState(state, data)
    })
  }
}

export function elementById(id, timeout) {
  return state => {
    return state.driver.wait(until.elementLocated(By.id(id)), 25 * 1000).then((element) => {
      return {
        ...state,
        element,
        references: [
          ...state.references,
          state.data
        ]
      }
    })
  }
}

export function type(text) {
  return state => {
    return state.element.sendKeys(text).then((data) => {
      return composeNextState(state, data)
    })
  }
}


export function elementClick() {
  return state => {
    return state.element.click().then((data) => {
      return composeNextState(state, data)
    })
  }
}

export function imageClick(type, needle) {
  return state => {
    return promiseRetry({ factor: 1, maxTimeout: 1000 }, (retry, number) => {
      console.log("try number " + number);
      return state.driver.takeScreenshot().then((haystack, err) => {
        return findInImage(getPath(state, needle), haystack)
        .catch(retry)
      })
    })
    .then(({ target, minMax }) => {
      console.log("Match Found: " + JSON.stringify(minMax));
      // if (type == 'double') {
        return doubleClick(state, target)
      // } else {
        // return singleClick(state, target)
      // }
    })
    .then((data) => {
      return composeNextState(state, data)
    })
  }
}

// export function press(key) {
//   return state => {
//     return state.element.sendKeys(Key.RETURN).then((data) => {
//       return composeNextState(state, data)
//     })
//   }
// }

// export function wait(needle) {
//   return state => {
//     return promiseRetry({ factor: 1, maxTimeout: 1000 }, (retry, number) => {
//       return state.driver.takeScreenshot().then((haystack, err) => {
//         return findInImage(getPath(state, needle), haystack)
//         .catch(retry)
//       })
//     })
//     .then((data) => {
//       return composeNextState(state, data)
//     })
//   }
// }

export function ocr(image, x, y, X, Y) {
  return state => {
    console.log(getPath(state, image))
    readText(getPath(state, image))
    return composeNextState(state, data)
  }
}

export {
  field,
  fields,
  sourceValue,
  alterState,
  each,
  merge,
  dataPath,
  dataValue,
  lastReferenceValue
}
from 'language-common';
