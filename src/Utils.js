import { writeFile, readFileSync } from 'fs';

export function base64_encode(file) {
  var bitmap = readFileSync(file);
  return new Buffer(bitmap).toString('base64');
}

export function getPath(state, image) {
  return `${state.imageDir}/${image}`
};

export function screenshot(driver, output) {
  driver.takeScreenshot()
  .then((image) => {
    writeFile(output, image, 'base64')
  });
}

export function offsetClick(state, target) {
  console.log("Clicking: " + JSON.stringify(target));
  return state.driver.actions()
    .mouseMove(state.element, target)
    .click()
    .perform()
}

export function parseKeys(state, keys) {
  return keys.map((item) => {
    if (item.startsWith('Key.')) {
      return state.Key[item.substring(item.indexOf(".") +1 )]
    } else {
      return item
    }
  }).join('')
}
