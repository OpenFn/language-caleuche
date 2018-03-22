/** @module Adaptor */
import {execute as commonExecute, expandReferences, composeNextState} from 'language-common';
import {findInImage} from './OpenCV';
import {readText} from './OCR'
import {screenshot, getPath} from './Utils';
import {writeFile} from 'fs';
import {promisify} from 'util';
import {Builder, By, Key, promise, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox';
import chrome from 'selenium-webdriver/chrome';
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

  // const firefoxCapabilities = webdriver.Capabilities.firefox();
  // firefoxCapabilities
  // .set('acceptInsecureCerts', true)

  const driver = new webdriver.Builder()
    // .forBrowser('firefox')
    // .setFirefoxOptions(new firefox.Options().headless())
    // .withCapabilities(firefoxCapabilities)
    .forBrowser('chrome')
    // .setChromeOptions(new chrome.Options().headless())
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

/** ============================================================================
 * Runs a function with access to state and the webdriver.
 * @public
 * @example
 *  driver(callback)
 * @function
 * @param {Function} func is the function
 * @returns {<Operation>}
 */
// TODO: fix this...
export function driver(func) {
  return state => {
    return func(state)
  }
}
// =============================================================================

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

export function press(key) {
  return state => {
    return state.element.sendKeys(Key.RETURN).then((data) => {
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
      return state.driver.takeScreenshot().then((haystack, err) => {
        return findInImage(getPath(state, needle), haystack)
        .catch(retry)
      })
    })
    .then(({targetPos, minMax}) => {
      console.log("Match Found: " + JSON.stringify(minMax));
      doubleClick(state, targetPos)
    })
    .then((data) => {
      return composeNextState(state, data)
    })
  }
}

function singleClick(state, target) {
  console.log("in the d-click function");
  return state.driver.actions()
    .mouseMove(state.element, targetPos)
    .click()
    .perform()
}

function doubleClick(state, target) {
  console.log("in the d-click function");
  return state.driver.actions()
    .mouseMove(state.element, targetPos)
    .doubleClick()
    .perform()
}

export function wait(needle) {
  return state => {
    return promiseRetry({ factor: 1, maxTimeout: 1000 }, (retry, number) => {
      return state.driver.takeScreenshot().then((haystack, err) => {
        return findInImage(getPath(state, needle), haystack)
        .catch(retry)
      })
    })
    .then((data) => {
      return composeNextState(state, data)
    })
  }
}

export function ocr(image, x, y, X, Y) {
  return state => {
    console.log(getPath(state, image))
    readText(getPath(state, image))
    return composeNextState(state, data)
  }
}

export function doubleClick(element, location) {
  return state => {
    const act = new Actions(state.driver)
    return (
      elem
      ? act.moveToElement(element).moveByOffset(10, 20).doubleClick().perform()
      : state.element.doubleClick()
    ).then((data) => {
      return composeNextState(state, data)
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
