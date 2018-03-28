import {expect} from 'chai';
import Adaptor from '../src';
const {
  execute,
  post,
  wait,
  driver,
  type,
  elementById,
  url,
  click,
  assertVisible,
  conditional
} = Adaptor;
import {composeNextState} from 'language-common';

describe("execute", () => {

  it("executes each operation in sequence", (done) => {
    let state = {
      imageDir: "./test"
    }
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
        return state.driver.actions().sendKeys("a").perform().then(() => {
          return composeNextState(state, 3)
        })
      }),
      url("file:///home/taylor/language-packages/language-caleuche/test/sample_page.html"),
      elementById("main-q"),
      click(),
      (state) => {
        console.log(4);
        return composeNextState(state, 4)
      },
      // assertVisible("sample_text_needle.png"),
      click("single", "sample_text_needle.png"),
      // click("single", "messi.jpg", 2000),
      // click("single", ["sample_text_needle.png", "messi.jpg"], 2000),
      (state) => {
        console.log(5);
        return composeNextState(state, 5)
      },
      conditional(
        assertVisible("messi.jpg", 100),
        driver(state => {
          console.log("Found Messi.");
          return state;
        }),
        driver(state => {
          console.log("No Messi.");
          return state;
        })
      ),
      elementById("main-q"),
      type("a"),
      type(["a", "234"]),
      driver(state => {
        return state.element.sendKeys("abc", state.Key.TAB).then(() => {
          return state
        })
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
        }).then(() => {
          return composeNextState(state, 7)
        })
      }),
      (state) => {
        return composeNextState(state, 8)
      },
      wait(10),
      conditional(true, wait(20), null)
    ]

    execute(...operations)(state).then((finalState) => {

      const next = {
        "data": 8,
        "imageDir": "./test",
        "references": [
          null,
          1,
          2,
          3,
          4,
          5,
          7
        ]
      }

      expect(finalState).to.eql(next)

    }).then(done).catch(done)

  })

})
