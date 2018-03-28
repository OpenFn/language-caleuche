import {expect} from 'chai';
import nock from 'nock';
import Adaptor from '../src';
const { execute, post, wait, driver, type, elementById, url, click,
  assertVisible } = Adaptor;
import { composeNextState } from 'language-common';

describe("execute", () => {

  it("executes each operation in sequence", (done) => {
    let state = {imageDir: "./test"}
    let operations = [
      (state) => {
        console.log(1);
        return composeNextState(state, 1)
      },
      (state) => {
        console.log(2);
        return composeNextState(state, 2)
      },
      driver(state => {
          console.log(3);
          return state.driver.actions().sendKeys("a").perform()
          .then(() => { return composeNextState(state, 3) })
      }),
      url("https://www.google.com"),
      elementById("hplogo"),
      click(),
      (state) => {
        console.log(4);
        return composeNextState(state, 4)
      },
      assertVisible("google_e.png"),
      click("single", "google_e.png"),
      (state) => {
        console.log(5);
        return composeNextState(state, 5)
      },
      elementById("lst-ib"),
      type("a"),
      type(["a", "234"]),
      driver(state => {
          return state.element.sendKeys("abc", state.Key.TAB)
          .then(() => { return state })
      }),
      click(),
      driver(state => {
        console.log(6);
        return wait(10)(state)
      }),
      driver(state => {
          console.log(7);
          return new Promise(function(resolve, reject) {
              setTimeout(() => {
                  resolve();
              }, 10)
          })
          .then(() => { return composeNextState(state, 7) })
      }),
      (state) => {
        return composeNextState(state, 8)
      },
      wait(10)
    ]

    execute(...operations)(state).then((finalState) => {

      const next = {
        "data": 8,
        "imageDir": "./test",
        "references": [null, 1, 2, 3, 4, 5, 7]
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)

  })

  it("assigns references, data to the initialState", () => {
    let state = {}

    let finalState = execute()(state)

    execute()(state).then((finalState) => {
      expect(finalState).to.eql({references: [], data: null})
    })

  })
})

// describe("post", () => {
//
//   before(() => {
//     nock('https://fake.server.com').post('/api').reply(200, {foo: 'bar'});
//   })
//
//   it("calls the callback", () => {
//     let state = {
//       configuration: {
//         username: "hello",
//         password: "there"
//       }
//     };
//
//     return execute(post({
//       "url": "https://fake.server.com/api",
//       "headers": null,
//       "body": {"a": 1}
//     }))(state).then((state) => {
//       let responseBody = state.response.body
//       // Check that the post made it's way to the request as a string.
//       expect(responseBody).to.eql({foo: 'bar'})
//     })
//   })
// })
