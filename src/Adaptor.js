import {execute as commonExecute, expandReferences} from 'language-common';
import request from 'request';
import {resolve as resolveUrl} from 'url';

/** @module Adaptor */

/**
 * Execute a sequence of operations.
 * Wraps `language-common/execute`, and prepends initial state for http.
 * @example
 * execute(
 *   create('foo'),
 *   delete('bar')
 * )(state)
 * @constructor
 * @param {Operations} operations - Operations to be performed.
 * @returns {Operation}
 */
export function execute(...operations) {
  const initialState = {
    references: [],
    data: null
  }

  return state => {
    return commonExecute(...operations)({
      ...initialState,
      ...state
    })
  };

}

/**
 * Make a POST request
 * @example
 * execute(
 *   post(params)
 * )(state)
 * @constructor
 * @param {object} params - data to make the fetch
 * @returns {Operation}
 */
export function post(params) {

  return state => {

    function assembleError({response, error}) {
      if (response && ([200, 201, 202].indexOf(response.statusCode) > -1))
        return false;
      if (error)
        return error;
      return new Error(`Server responded with ${response.statusCode}`)
    }

    const {url, body, headers} = expandReferences(params)(state);

    return new Promise((resolve, reject) => {
      console.log("Request body:");
      console.log("\n" + JSON.stringify(body, null, 4) + "\n");
      request.post({
        url: url,
        json: body,
        headers
      }, function(error, response, body) {
        error = assembleError({error, response})
        if (error) {
          reject(error);
          console.log(response);
        } else {
          console.log("Printing response...\n");
          console.log(JSON.stringify(response, null, 4) + "\n");
          console.log("POST succeeded.");
          resolve(body);
        }
      })
    }).then((data) => {
      const nextState = {
        ...state,
        response: {
          body: data
        }
      };
      return nextState;
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
