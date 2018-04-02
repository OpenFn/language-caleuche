import {expect} from 'chai';
import Adaptor from '../lib';
const { execute } = Adaptor;
import { kitchenSink } from './testExpressions.js';

describe("execute", () => {

  it("executes each operation in sequence successfully", (done) => {

    let state = {
      imageDir: "./test"
    }

    let operations = kitchenSink;

    execute(...operations)(state).then((finalState) => {

      const next = {
        "data": 8,
        "delay": 13,
        "imageDir": "./test",
        "references": [
          null,
          1,
          2,
          3,
          4,
          {"result": "OCR mocked, results go here."},
          5,
          7
        ]
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)

  })

})
