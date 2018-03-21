/** @module Adaptor */
import {execute as commonExecute, expandReferences, composeNextState} from 'language-common';
import {findInImage} from './OpenCV';
import {readText} from './OCR'
import {screenshot, getPath} from './Utils';
import {writeFile} from 'fs';
import {promisify} from 'util';
import {Builder, By, Key, promise, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox';

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
  var driver = new webdriver.Builder().forBrowser('chrome').build();

  const initialState = {
    references: [],
    data: null,
    driver
  }

  return state => {
    return commonExecute(...operations, cleanupState)({
      ...initialState,
      ...state
    })
  };

}

function cleanupState(state) {
  state.driver.quit();
  delete state.driver;
  delete state.element;
  return state;
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
    return state.driver.wait(until.elementLocated(By.id(id)), 15 * 1000).then((element) => {
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

function createPromise(tries, willFail, driver, image) {
  return new Promise(function cb(resolve, reject) {
    screenshot(driver)
    const coords = find(image);
    if (--tries > 0) {
      setTimeout(function() {
        cb(resolve, reject);
      }, 500);
    } else {
      if (willFail) {
        reject('Failed to find Waldo.');
      } else {
        resolve(coords);
      }
    }
  });
}

export function imageClick(needle) {
  return state => {

      return state.driver.takeScreenshot().then((haystack, err) => {
        return findInImage(getPath(state, needle), haystack)
      })
      .then((data) => {
        const nextState = composeNextState(state, data)
        return state;
      })

  }
}

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
