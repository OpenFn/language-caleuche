/** @module Adaptor */
import {execute as commonExecute, expandReferences, composeNextState} from 'language-common';
import {findInImage} from './OpenCV';
import {readText} from './OCR'
import {screenshot, getPath, singleClick, doubleClick} from './Utils';
import {writeFile} from 'fs';
import {promisify} from 'util';
import {Builder, By, Key, promise, until} from 'selenium-webdriver';
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
export function driver(func) {
  return state => {
    return func(state);
  }
}

export function conditional(test, funTrue, funFalse) {
  return state => {
    console.log("starting test...");
    return test(state)
    .then(() => {
      console.log("it was true...");
      return funTrue(state)
    })
    .catch(() => {
      console.log("it was false...");
      if (funFalse) {
        return funFalse(state)
      } else {
        return state;
      }
    })
  }
}

export function wait(ms) {
  return state => {
    return new Promise(resolve => setTimeout(() => resolve(state), ms))
    .then(() => { return state });
  }
}

export function url(url) {
  return state => {
    return state.driver.get(url)
    .then(() => { return state })
  }
}

export function elementById(id, timeout) {
  return state => {
    return state.driver.wait(until.elementLocated(By.id(id)), 25 * 1000)
    .then((element) => { return { ...state, element } })
  }
}

export function type(text) {
  return state => {
    return state.element.sendKeys(text)
    .then(() => { return state })
  }
}


export function elementClick() {
  return state => {
    return state.element.click()
    .then(() => { return state })
  }
}

export function visible(needle) {
  return state => {
    return promiseRetry({ factor: 1, maxTimeout: 1000 }, (retry, number) => {
      console.log(`trying ${needle}: ${number}`);
      return state.driver.takeScreenshot().then((haystack, err) => {
        return findInImage(getPath(state, needle), haystack)
        .catch(retry)
      })
    })
  }
}

export function imageClick(type, needle) {
  return state => {
    return promiseRetry({ factor: 1, maxTimeout: 1000 }, (retry, number) => {
      console.log(`trying ${needle}: ${number}`);
      return state.driver.takeScreenshot().then((haystack, err) => {
        return findInImage(getPath(state, needle), haystack)
        .catch(retry)
      })
    })
    .then(({ target, minMax }) => {
      console.log("Match Found: " + JSON.stringify(minMax));
      if (type == 'double') {
        return doubleClick(state, target)
      } else {
        return singleClick(state, target)
      }
    })
    .then(() => { return state })
  }
}

export function ocr(image, x, y, X, Y) {
  return state => {
    readText(getPath(state, image))
    // TODO: allow user to set key:value in nextState for data from OCR
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
