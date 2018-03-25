export function getPath(state, image) {
  return `./${state.imageDir}/${image}`
};

export function screenshot(driver, output) {
  driver.takeScreenshot()
  .then((image) => {
    require('fs').writeFile(output, image, 'base64')
  });
}

export function offsetClick(state, target) {
  return state.driver.actions()
    .mouseMove(state.element, target)
    .click()
    .perform()
}
