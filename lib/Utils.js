'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPath = getPath;
exports.screenshot = screenshot;
exports.offsetClick = offsetClick;
function getPath(state, image) {
  return './' + state.imageDir + '/' + image;
};

function screenshot(driver, output) {
  driver.takeScreenshot().then(function (image) {
    require('fs').writeFile(output, image, 'base64');
  });
}

function offsetClick(state, target) {
  return state.driver.actions().mouseMove(state.element, target).click().perform();
}
