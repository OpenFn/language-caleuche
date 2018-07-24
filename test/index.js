import {expect} from 'chai';
import Adaptor from '../lib';
const {execute} = Adaptor;
import {
  kitchenSink,
  conditionals,
  readText,
  slowTyper,
  sendKeyChecker,
  typist,
  screenshot,
  stateLogical,
  theAtSymbol,
} from './testExpressions.js';

describe("execute", () => {

  let state = {
    imageDir: "./test"
  }

  it("executes each operation in sequence successfully", (done) => {

    execute(...kitchenSink)(state).then((finalState) => {

      const next = {
        "data": 8,
        "delay": 13,
        "imageDir": "./test",
        "references": [
          null,
          1,
          2,
          3,
          4, {
            "result": "OCR mocked, results go here."
          },
          5,
          7
        ]
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)

  })

  it("handles complex conditionals", (done) => {

    const state = {
      "data": {"a": 1},
      "imageDir": "./test"
    }

    execute(...conditionals)(state).then((finalState) => {

      const next = {
        "data": {"a": 1},
        "delay": 0,
        "imageDir": "./test",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)

  })

  it("can read text from an element in a web page", (done) => {
    execute(...readText)(state).then((finalState) => {

      const next = {
        "data": null,
        "delay": 0,
        "some_text": "Hello There World!",
        "imageDir": "./test",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)
  })

  it("can type slowly using huntAndPeck", (done) => {
    execute(...slowTyper)(state).then((finalState) => {

      const next = {
        "data": null,
        "delay": 500,
        "imageDir": "./test",
        "references": []
      }

      expect(finalState).to.eql(next)
    }).then(done).catch(done)
  })

  it("types properly with `state.element.sendKeys(...)`", (done) =>{
    execute(...sendKeyChecker)(state).then((finalState) => {

      const next = {
        "data": null,
        "delay": 0,
        "entered_text": "here is the deepest secret nobody knows",
        "imageDir": "./test",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)
  })

  it.only("types properly with `type(...)`", (done) =>{

    let state = {
      imageDir: "./test",
      data: {
        "noKeyPresent": "fine",
        "prefix": "here "
      }
    }

    execute(...typist)(state).then((finalState) => {

      const next = {
        "data": null,
        "delay": 0,
        "entered_text": "here is the root of the root and the bud of the bud",
        "chars": "1234567890 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "finally": "and the sky of the sky of a tree called life",
        "imageDir": "./test",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)
  })

  it("takes a screenshot", (done) =>{
    execute(...screenshot)(state).then((finalState) => {

      const next = {
        "data": null,
        "delay": 0,
        "imageDir": "./test",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)
  })

  it("can type an @ symbol", (done) =>{

    execute(...theAtSymbol)(state).then((finalState) => {

      const next = {
        "data": null,
        "delay": 0,
        "imageDir": "./test",
        "entered_text": "can we type the @ symbol?",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)
  })

})
