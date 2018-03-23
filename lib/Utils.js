'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPath = getPath;
exports.screenshot = screenshot;
exports.singleClick = singleClick;
exports.doubleClick = doubleClick;
function getPath(state, image) {
  return './' + state.path_to_images + '/' + image;
};

function screenshot(driver, output) {
  driver.takeScreenshot().then(function (image) {
    require('fs').writeFile(output, image, 'base64');
  });
}

function singleClick(state, target) {
  return state.driver.actions().mouseMove(state.element, target).click().perform();
}

function doubleClick(state, target) {
  state.driver.actions().mouseMove(state.element, target).click().perform();
  state.driver.actions().mouseMove(state.element, target).click().perform();
}
