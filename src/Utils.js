export function getPath(state, image) {
  return `./${state.path_to_images}/${image}`
};

export function screenshot(driver, output) {
  driver.takeScreenshot().then(
    function(image, err) {
      require('fs').writeFile(output, image, 'base64', function(err) {
        console.log(err);
      });
    }
  );
}

export function singleClick(state, target) {
  console.log(target);
  // return state.driver.executeScript(`document.elementFromPoint(${target.x}, ${target.y}).click();`)
  return state.driver.actions()
    .mouseMove(state.element, target)
    .click()
    .perform()
}


export function doubleClick(state, target) {
  state.driver.actions()
    .mouseMove(state.element, target)
    .click()
    .perform()
  state.driver.actions()
    .mouseMove(state.element, target)
    .click()
    .perform()
  // console.log(target);
  // const dblclick = `var ev = new MouseEvent('dblclick', {
  //           'view': window,
  //       'bubbles': true,
  //       'cancelable': true,
  //       'screenX': ${target.x},
  //       'screenY': ${target.y}
  //   });`
  // const doIt = `document.getElementById('mainCanvas').trigger(ev);`
  // return state.driver.executeScript(dblclick, doIt);
  // // setTimeout(function () {
  // //   state.driver.executeScript(`document.elementFromPoint(${target.x}, ${target.y}).click();`)
  // // }, 100);
  // // return state.driver.actions()
  // //   .mouseMove(state.element, target)
  // //   .doubleClick()
  // //   .perform()
}
