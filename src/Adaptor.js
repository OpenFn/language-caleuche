/** @module Adaptor */
import {execute as commonExecute, expandReferences, composeNextState} from 'language-common';
import {findInImage} from './OpenCV';
import {readText} from './OCR'
import {screenshot, getPath} from './Utils';
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
  var webdriver = require('selenium-webdriver');
  const chromeCapabilities = webdriver.Capabilities.chrome();
    chromeCapabilities.set('chromeOptions', {
      'args': ['--headless']
    });
  var driver = new webdriver.Builder()
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
    return commonExecute(...operations, cleanupState)({
      ...initialState,
      ...state
    })
  };

}

function cleanupState(state) {
  // screenshot(state.driver, 'tmp/img/finalScreen.png')
  state.driver.quit();
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
export function driver(func) {
 return state => {
   return func(state)
 }
}

export function url(url) {
  return state => {
    return state.driver.get(url).then((data) => {
      const nextState = composeNextState(state, data)
      return nextState;
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
      const nextState = composeNextState(state, data)
      return state;
    })
  }
}

export function elementClick() {
  return state => {
    return state.element.click().then((data) => {
      const nextState = composeNextState(state, data)
      return state;
    })
  }
}

// TODO: Refactor into a single function with click options ====================
export function imageClick(needle) {
  return state => {

    return promiseRetry({ factor: 1, maxTimeout: 1000 }, (retry, number) => {
      console.log('attempt number', number);
      return state.driver.takeScreenshot().then((haystack, err) => {
        return findInImage(getPath(state, needle), haystack)
        .catch(retry)
      })
    })
    .then((targetPos) => {
      // console.log(targetPos);
      state.driver.actions()
        .mouseMove(state.element, targetPos)
        .click()
        .perform()
    })
    .then((data) => {
      const nextState = composeNextState(state, data)
      return state;
    })

  }
}

export function imageDoubleClick(needle) {
  return state => {

    return promiseRetry({ factor: 1, maxTimeout: 1000 }, (retry, number) => {
      console.log('attempt number', number);
      return state.driver.takeScreenshot().then((haystack, err) => {
        return findInImage(getPath(state, needle), haystack)
        .catch(retry)
      })
    })
    .then((targetPos) => {
      console.log(targetPos);
      state.driver.actions()
        .mouseMove(state.element, targetPos)
        .doubleClick()
        .perform()
    })
    .then((data) => {
      const nextState = composeNextState(state, data)
      return state;
    })

  }
}
// =============================================================================

export function wait(image) {
  return state => {
    return promiseRetry({ factor: 1, maxTimeout: 2000 }, (retry, number) => {
      console.log('attempt number', number);
      return state.driver
        .findInImage(getPath(state, needle), haystack)
        .catch(retry)
    })
    .then((data) => {
      const nextState = composeNextState(state, data)
      return state;
    })
  }
}

export function ocr(image, x, y, X, Y) {
  return state => {
    console.log(getPath(state, image))
    readText(getPath(state, image))
    return state;
  }
}

// export function find(image) {
//   return state => {
//     return findInImage(getPath(state, image), getPath(state, "screen.png"))
//   }
// };

export function doubleClick(element, location) {
  return state => {
    const act = new Actions(state.driver)
    return (
      elem
      ? act.moveToElement(element).moveByOffset(10, 20).doubleClick().perform()
      : state.element.doubleClick()).then((data) => {
      const nextState = composeNextState(state, data)
      return state;
    })
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
