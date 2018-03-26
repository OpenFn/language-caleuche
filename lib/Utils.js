'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.base64_encode = base64_encode;
exports.getPath = getPath;
exports.screenshot = screenshot;
exports.offsetClick = offsetClick;

var _fs = require('fs');

function base64_encode(file) {
  var bitmap = (0, _fs.readFileSync)(file);
  return new Buffer(bitmap).toString('base64');
}

function getPath(state, image) {
  return state.imageDir + '/' + image;
};

function screenshot(driver, output) {
  driver.takeScreenshot().then(function (image) {
    (0, _fs.writeFile)(output, image, 'base64');
  });
}

function offsetClick(state, target) {
  console.log("Clicking: " + JSON.stringify(target));
  return state.driver.actions().mouseMove(state.element, target).click().perform();
}
