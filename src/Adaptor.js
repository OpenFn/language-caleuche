/** @module Adaptor */
import { execute as commonExecute, expandReferences, composeNextState } from 'language-common';
import { findInImage, cropImage } from './OpenCV';
import { readText } from './OCR'
import { screenshot, getPath, offsetClick, base64_encode, parseKeys } from './Utils';
import { promisify } from 'util';
import { Builder, By, Key, promise, until } from 'selenium-webdriver';
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
    'args': [
      '--headless',
      '--no-gpu',
      '--window-size=1920,1080',
      '--lang=es',
    ]
  })
  .set('acceptInsecureCerts', true)

  const driver = new webdriver.Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .build();

  const initialState = {
    references: [],
    data: null,
    options: {
      delay: 0,
      confidence: 0.95,
      retries: 10,
    },
    driver,
    By,
    Key,
    promise,
    until
  }

  return state => {
    return commonExecute(
      ...operations,
      cleanupState
    )({...initialState, ...state})
    .catch((e) => {
      screenshot(driver, 'tmp/error.png')
      driver.quit();
      throw e;
    })
  };

}

function cleanupState(state) {
  if (state.driver) {
    screenshot(state.driver, 'tmp/final_screen.png')
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
    return func(state)
  }
}

export function conditional(test, funTrue, funFalse) {
  return state => {

    function wrapper(boolean) {
      return new Promise(function(resolve, reject) {
        ( boolean ? resolve() : reject() )
      })
    }

    return ( typeof test == 'boolean' ? wrapper(test) : test(state) )
    .then(() => {
      return funTrue(state)
    })
    .catch(() => {
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
    console.log(`Waiting for ${ms}ms...`);
    return new Promise(function(resolve, reject) {
        setTimeout(() => {
            resolve();
        }, ms)
    })
    .then(() => { return state })
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
    return state.driver.wait(
      until.elementLocated(By.id(id)),
      timeout || 25 * 1000
    )
    .then((element) => { return { ...state, element } })
  }
}

export function elementByCss(className, timeout) {
  return state => {
    return state.driver.wait(
      until.elementLocated(By.css(className)),
      timeout || 25 * 1000
    )
    .then((element) => { return { ...state, element } })
  }
}

export function elementByXPath(id, timeout) {
  return state => {
    return state.driver.wait(
      until.elementLocated(By.xpath(id)),
      timeout || 25 * 1000
    )
    .then((element) => { return { ...state, element } })
  }
}

export function elementByName(name, timeout) {
  return state => {
    return state.driver.wait(
      until.elementLocated(By.name(name)),
      timeout || 25 * 1000
    )
    .then((element) => { return { ...state, element } })
  }
}

export function type(keys) {
  return state => {

    const array = (typeof keys == 'string' ? [keys] : keys)
    console.log("Typing: " + parseKeys(state, array));
    return state.driver.actions().sendKeys(
      parseKeys(state, array)
    )
    .perform()
    .then(sleep(state.options.delay))
    .then(() => { return state })

  }
}

export function typeInElement(keys) {
  return state => {
    const array = (typeof keys == 'string' ? [keys] : keys)
    console.log("Typing: " + parseKeys(state, array));
    return state.element.sendKeys(
      parseKeys(state, array)
    )
    .then(sleep(state.options.delay))
    .then(() => { return state })

  }
}

function shiftCase(key) {
  if (isNaN(key) && key.toUpperCase() === key) {
    return chord(['Key.SHIFT', key]);
  }
  return type(key);
}

export function huntAndPeck(keys, options) {
  return state => {
    const array = keys.split('')
    console.log('Sending each character to Selenium individually: ' + parseKeys(state, array));
    const operations = array.map(key => {
      if (options.manualCase) {
        return shiftCase(key)
      }
      return type(key)
    })

    const start = Promise.resolve(state)

    return operations.reduce((acc, operation) => {
      return acc.then(operation);
    }, start)

  }
}

export function chord(keys) {
  return state => {

    console.log('Chording: ' + parseKeys(state, keys));

    // NOTE: `return state.element.sendKeys(...)` is another option here.
    // Decided on sending to the driver as it does not requre an element.
    return state.driver.actions().sendKeys(
      state.Key.chord(
        parseKeys(state, keys)
      )
    )
    .perform()
    .then(sleep(state.options.delay))
    .then(() => { return state })

  }
}

function searchArray(state, input, timeout, confidence) {
  const imageArray = (typeof input == 'object' ? input : [input])
  return imageArray.map(img => {
    return search(state, getPath(state, img), timeout, confidence)
  });
}

export function setDelay(ms) {
  return state => {
    state.options.delay = ms;
    return state;
  }
}

export function setConfidence(float) {
  return state => {
    state.options.confidence = float;
    return state;
  }
}

export function pushOptions(obj) {
  return state => {
    state.options = { ...state.options, ...obj }
    return state;
  }
}

function sleep(ms) {
  return function(state) {
    return new Promise(resolve => setTimeout(() => resolve(state), ms));
  };
}

export function assertVisible(needle, options) {
  return state => {
    const { timeout, confidence } = options || {};
    console.log(`Searching for: ${needle}`);
    return Promise.race(
      searchArray(state, needle, timeout, confidence)
    )
    .then(() => { return state })
  }
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
export function click(type, needle, options) {
  return state => {
    const { timeout, confidence } = options || {};
    console.log(`Attempting to ${type} click on: ${needle}`);
    if (!needle) {
      return state.element.click()
      .then(() => {
        return ( type == 'double' && state.element.click() )
      })
      .then(sleep(state.options.delay))
      .then(() => { return state })
    } else {
      return Promise.race(
        searchArray(state, needle, timeout, confidence)
      )
      .then(({ target, minMax }) => {
        offsetClick(state, target)
        return target
      })
      .then((target) => {
        return ( type == 'double' && offsetClick(state, target) )
      })
      .then(sleep(state.options.delay))
      .then(() => { return state })
    }
  }
}

function search(state, image, timeout, confidence) {
  const options = {
    retries: ( timeout ? (timeout*2) / 1000 : state.options.retries ), // The maximum amount of times to retry the operation. Default is 10.
    factor: 2, // The exponential factor to use. Default is 2.
    minTimeout: 500, // The number of milliseconds before starting the first retry. Default is 1000.
    maxTimeout: 1000, // The maximum number of milliseconds between two retries. Default is Infinity.
    randomize: false // Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is false.
  }

  return promiseRetry(options, (retry, number) => {
    return state.driver.takeScreenshot().then((haystack, err) => {
      return findInImage(base64_encode(image), haystack, confidence || state.options.confidence)
    })
    .catch(retry)
  })
  .then(({ target, minMax }) => {
    console.log(`Found: ${image}.`);
    return { target, minMax };
  })
}

export function ocr({ label, image, authKey, offsetX, offsetY, width, height, mock }) {
  return state => {
    var data = {};
    if (mock) {

      data[label] = "OCR mocked, results go here."
      return composeNextState(state, data)

    } else {

      const anchorImage = getPath(state, image);

      return search(state, anchorImage)
      .then(({target}) => {
        const xPos = target.x + offsetX;
        const yPos = target.y + offsetY;
        return state.driver.takeScreenshot()
        .then((fullScreen) => {
          return cropImage(fullScreen, xPos, yPos, width, height)
        })
      })
      .then((imageToRead) => {
        return readText(imageToRead, authKey)
      })
      .then((results) => {
        const fullTextAnnotation = results.responses[0].fullTextAnnotation.text;
        data[label] = fullTextAnnotation;
        console.log(data);
        return composeNextState(state, data)
      })

    }
  }
};

export function printScreen(output) {
  return state => {
    screenshot(state.driver, `tmp/${output}`)
    return state;
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
  lastReferenceValue,
  execute as commonExecute,
}
from 'language-common';
