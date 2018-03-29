import {composeNextState} from 'language-common';
import {
  assertVisible,
  click,
  chord,
  conditional,
  driver,
  elementByCss,
  elementById,
  execute,
  post,
  setDelay,
  type,
  url,
  wait,
} from '../lib/Adaptor';

const kitchenSink = [
  setDelay(13),
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
  conditional(
    elementByCss('#close-header-search > span', 500),
    driver(state => {
      console.log("hi there.");
      return state;
    }),
    null
  ),
  conditional(
    elementByCss("#mookie-blaylock", 500),
    driver(state => {
      console.log("hi there.");
      return state;
    }),
    driver(state => {
      console.log("no mookie.");
      return state;
    })
  ),
  click(),
  (state) => {
    console.log(4);
    return composeNextState(state, 4)
  },
  assertVisible("sample_text_needle.png"),
  click("single", "sample_text_needle.png", 2000),
  // click("single", "messi.jpg", 1000),
  click("single", ["sample_text_needle.png", "messi.jpg"], 2000),
  // click("single", ["sample_text_needle.png", "sample_text_needle.png"], 2000),
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
  chord(['Key.CONTROL', 's']),
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

export { kitchenSink };
