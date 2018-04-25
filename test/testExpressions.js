import {composeNextState} from 'language-common';
import {
  alterState,
  assertVisible,
  chord,
  click,
  conditional,
  driver,
  elementByCss,
  elementById,
  execute,
  huntAndPeck,
  ocr,
  post,
  setDelay,
  type,
  typeInElement,
  url,
  wait
} from '../lib/Adaptor';

const typist = [
  url("file:///home/taylor/language-packages/language-caleuche/test/sample_page.html"),
  elementById("main-q"),
  driver(state => {
    return state.element.click().then(() => {
      return state
    })
  }),
  type("here is the root of the root and the bud of the bud"),
  driver(state => {
    return state.element.getAttribute("value").then(function (text) {
      state.entered_text = text
      return state
    })
  }),
  driver(state => {
    return state.element.getAttribute("value").then(function (text) {
      state.entered_text = text
      return state
    })
  }),
  driver(state => {
    return state.element.clear().then(() => {
      return state
    })
  }),
  type("1234567890 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
  driver(state => {
    return state.element.getAttribute("value").then(function (text) {
      state.chars = text
      return state
    })
  }),
  driver(state => {
    return state.element.clear().then(() => {
      return state
    })
  }),
  typeInElement("and the sky of the sky of a tree called life"),
  driver(state => {
    return state.element.getAttribute("value").then(function (text) {
      state.finally = text
      return state
    })
  })
]

const sendKeyChecker = [
  url("file:///home/taylor/language-packages/language-caleuche/test/sample_page.html"),
  elementById("main-q"),
  type("hi mom."),
  driver(state => {
    const text = "here is the deepest secret nobody knows"
    return state.element.sendKeys(text).then(() => {
      return state
    })
  }),
  driver(state => {
    return state.element.getAttribute("value").then(function (text) {
      console.log(text);
      state.entered_text = text
      return state
    })
  }),
  wait(2000)
]

const slowTyper = [
  setDelay(500),
  url("file:///home/taylor/language-packages/language-caleuche/test/sample_page.html"),
  elementById("main-q"),
  huntAndPeck("hello there")
]

const readText = [
  url("file:///home/taylor/language-packages/language-caleuche/test/sample_page.html"),
  elementById("random-text-string"),
  driver(state => {
    return state.element.getText().then(function (text) {
      console.log(text);
      state.some_text = text
      return state
    })
  })
]

const conditionals = [
  url("file:///home/taylor/language-packages/language-caleuche/test/sample_page.html"),
  conditional(
    assertVisible("messi.jpg", 500),
    driver(state => {
      console.log("when true.");
      return state;
    }),
    state => {
      console.log("when false.")
      return wait(2000)(state)
      .then(state => {
        return assertVisible("sample_text_needle.png")(state)
      })
      .then(state => {
        console.log("after waiting and asserting!")
        return state
      })
    }
  )
]

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
  ocr({
    label: 'result',
    image: 'sample_text_needle.png',
    authKey: "blah",
    offsetX: 0,
    offsetY: 0,
    width: 1,
    height: 1,
    mock: true
  }),
  click("single", ["sample_text_needle.png", "messi.jpg"], 2000),
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

export { kitchenSink, conditionals, readText, slowTyper, sendKeyChecker, typist };
