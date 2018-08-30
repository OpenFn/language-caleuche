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
  capitalization,
} from './testExpressions.js';

describe("execute", () => {

  let state = {
    imageDir: "./test",
    options: {
      delay: 0,
      confidence: 0.95,
      retries: 10
    },
  }

  it("executes each operation in sequence successfully", (done) => {

    execute(...kitchenSink)(state).then((finalState) => {

      const next = {
        "data": 8,
        options: {
          delay: 13,
          confidence: 0.95,
          retries: 10
        },
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
      data: {
        a: 1
      },
      imageDir: "./test",
      options: {
        delay: 0,
        confidence: 0.95,
        retries: 10
      },
    }

    execute(...conditionals)(state).then((finalState) => {

      const next = {
        "data": {"a": 1},
        options: {
          delay: 0,
          confidence: 0.95,
          retries: 10
        },
        "imageDir": "./test",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)

  })

  it("can read text from an element in a web page", (done) => {
    execute(...readText)(state).then((finalState) => {

      const next = {
        references: [],
        data: null,
        options: { delay: 13, confidence: 0.95, retries: 10 },
        imageDir: './test',
        some_text: 'Hello There World!'
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)
  })

  it("can type slowly using huntAndPeck", (done) => {
    execute(...slowTyper)(state).then((finalState) => {

      const next = {
        "data": null,
        options: {
          delay: 500,
          confidence: 0.95,
          retries: 10
        },
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
        options: {
          delay: 500,
          confidence: 0.95,
          retries: 10
        },
        "entered_text": "here is the deepest secret nobody knows",
        "imageDir": "./test",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)
  })

  it("types properly with `type(...)`", (done) =>{

    let state = {
      imageDir: "./test",
      data: {
        prefix: "here "
      }
    }

    execute(...typist)(state).then((finalState) => {

      const next = {
        "data": {
          "prefix": "here "
        },
        options: {
          delay: 0,
          confidence: 0.95,
          retries: 10
        },
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
        options: {
          delay: 500,
          confidence: 0.95,
          retries: 10
        },
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
        options: {
          delay: 500,
          confidence: 0.95,
          retries: 10
        },
        "imageDir": "./test",
        "entered_text": "can we type the @ symbol?",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)
  })

  it("respects the input CASE of letters", (done) =>{

    execute(...capitalization)(state).then((finalState) => {

      const next = {
        "data": null,
        options: {
          delay: 500,
          confidence: 0.95,
          retries: 10
        },
        "imageDir": "./test",
        "entered_text": "What if Karl uses Proper Case?",
        "references": []
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)
  })

})
