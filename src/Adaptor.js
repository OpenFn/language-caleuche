/** @module Adaptor */
import {execute as commonExecute, expandReferences, composeNextState} from 'language-common';
import { findInImage } from './OpenCV';
import { getPath } from './Utils';
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

  // require('chromedriver');
  // var webdriver = require('selenium-webdriver');
  // var driver = new webdriver.Builder()
  //   .forBrowser('chrome')
  //   .build();

  const initialState = {
    references: [],
    data: null,
    // driver
  }

  return state => {
    return commonExecute(
      ...operations,
      cleanupState
    )({ ...initialState, ...state })
  };

}

function cleanupState(state) {
  // state.driver.quit();
  delete state.driver;
  delete state.element;
  return state;
}

export function url(url) {
  return state => {
      return state.driver.get(url)
      .then((data) => {
        const nextState = composeNextState(state, data)
        return nextState;
      })
  }
}

export function elementById(id, timeout) {
  return state => {
    return state.driver.wait(until.elementLocated(By.id(id)), 15 * 1000)
    .then((element) => {
      return {
        ...state,
        element,
        references: [ ...state.references, state.data ]
      }
    })
  }
}

export function type(text) {
  return state => {
    return state.element.sendKeys(text)
    .then((data) => {
      const nextState = composeNextState(state, data)
      return state;
    })
  }
}

export function click() {
  return state => {
    return state.element.click()
    .then((data) => {
      const nextState = composeNextState(state, data)
      return state;
    })
  }
}

export function wait(timeout) {
  return state => {
    return setTimeout(function(){
      console.log("hi mom")
    }, 1500)
    .then((data) => {
      const nextState = composeNextState(state, data)
      return state;
    })
  }
}

export function find(image) {
  return state => {
    return findInImage(getPath(state, image), getPath(state, "screen.png"))
    .then((data) => {
      const nextState = composeNextState(state, data)
      return state;
    })
  }
};

function screenshot(driver) {
  driver.takeScreenshot().then(
    function(image, err) {
      require('fs').writeFile('tmp/img/out.png', image, 'base64', function(err) {
        console.log(err);
      });
    }
  );
}

// export function ocr(x, y, w, h) {
//   request.post(google.vision.com)
//   .then()
// }

export function doubleClick(element, location) {
  return state => {
    const act = new Actions(state.driver)
    return (
      elem ?
      act.moveToElement(element).moveByOffset(10, 20).doubleClick().perform() :
      state.element.doubleClick()
    )
    .then((data) => {
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
