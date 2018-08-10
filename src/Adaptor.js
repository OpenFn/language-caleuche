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
      // '--profile-directory=Default',
      // '--load-extension=/home/taylor/.config/google-chrome/Default/Extensions/cbkkbcmdlboombapidmoeolnmdacpkch/4.47.1.3_0',
      // '--app-id=cbkkbcmdlboombapidmoeolnmdacpkch'
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
    delay: 0,
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
    console.log("typing: " + parseKeys(state, array));
    return state.driver.actions().sendKeys(
      parseKeys(state, array)
    )
    .perform()
    .then(sleep(state.delay))
    .then(() => { return state })

  }
}

export function typeInElement(keys) {
  return state => {

    const array = (typeof keys == 'string' ? [keys] : keys)
    console.log("typing: " + parseKeys(state, array));
    return state.element.sendKeys(
      parseKeys(state, array)
    )
    .then(sleep(state.delay))
    .then(() => { return state })

  }
}

export function huntAndPeck(keys) {
  return state => {

    const array = keys.split('')
    console.log("slowly hunting and pecking: " + parseKeys(state, array));

    const operations = array.map(key => {
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

    console.log("chording: " + parseKeys(state, keys));

    // NOTE: `return state.element.sendKeys(...)` is another option here.
    // Decided on sending to the driver as it does not requre an element.
    return state.driver.actions().sendKeys(
      state.Key.chord(
        parseKeys(state, keys)
      )
    )
    .perform()
    .then(sleep(state.delay))
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
    state.delay = ms;
    return state;
  }
}

function sleep(ms) {
  return function(state) {
    return new Promise(resolve => setTimeout(() => resolve(state), ms));
  };
}

export function assertVisible(needle, timeout, confidence) {
  return state => {
    console.log("assertVisible: " + confidence)
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
 * @param {integer} timeout is the image to search for on the screen/canvas
 * @returns {<Operation>}
 */
export function click(type, needle, timeout, confidence) {
  return state => {

    if (!needle) {

      return state.element.click()
      .then(() => {
        return ( type == 'double' && state.element.click() )
      })
      .then(sleep(state.delay))
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
      .then(sleep(state.delay))
      .then(() => { return state })

    }
  }
}

function search(state, image, timeout, confidence) {

  const options = {
    retries: ( timeout ? (timeout*2) / 1000 : 10 ), // The maximum amount of times to retry the operation. Default is 10.
    factor: 2, // The exponential factor to use. Default is 2.
    minTimeout: 500, // The number of milliseconds before starting the first retry. Default is 1000.
    maxTimeout: 1000, // The maximum number of milliseconds between two retries. Default is Infinity.
    randomize: false // Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is false.
  }

  return promiseRetry(options, (retry, number) => {
    return state.driver.takeScreenshot().then((haystack, err) => {
      return findInImage(base64_encode(image), haystack, confidence)
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
