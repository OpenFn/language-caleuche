'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPath = getPath;
exports.screenshot = screenshot;
function getPath(state, image) {
  return './' + state.path_to_images + '/' + image;
};

function screenshot(driver) {
  driver.takeScreenshot().then(function (image, err) {
    require('fs').writeFile('tmp/img/screen.png', image, 'base64', function (err) {
      console.log(err);
    });
  });
}
