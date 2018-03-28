'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findInImage = findInImage;
exports.cropImage = cropImage;

var _opencv4nodejs = require('opencv4nodejs');

var _opencv4nodejs2 = _interopRequireDefault(_opencv4nodejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findInImage(waldo, scene) {

  var needle = _opencv4nodejs2.default.imdecode(Buffer.from(waldo, 'base64'));
  var haystack = _opencv4nodejs2.default.imdecode(Buffer.from(scene, 'base64'));

  // Match template (the brightest locations indicate the highest match)
  var matched = haystack.matchTemplate(needle, 3);

  // Use minMaxLoc to locate the highest value (or lower, depending of the type of matching method)
  var minMax = matched.minMaxLoc();
  var _minMax$maxLoc = minMax.maxLoc,
      x = _minMax$maxLoc.x,
      y = _minMax$maxLoc.y;

  // Draw bounding rectangle

  haystack.drawRectangle(new _opencv4nodejs2.default.Rect(x, y, needle.cols, needle.rows), new _opencv4nodejs2.default.Vec(0, 255, 0), 2, _opencv4nodejs2.default.LINE_8);

  // write out the bounded waldo for debugging
  _opencv4nodejs2.default.imwrite('tmp/wheres_waldo.png', haystack);

  var target = {
    y: Math.floor(minMax.maxLoc.y + needle.rows / 2),
    x: Math.floor(minMax.maxLoc.x + needle.cols / 2)
  };

  if (minMax.maxVal > 0.90) {
    console.log('Found match with strength: ' + JSON.stringify(minMax.maxVal));
    return { target: target, minMax: minMax };
  } else {
    throw "No match found: " + JSON.stringify(minMax.maxVal);
  }
}

function cropImage(image, x, y, w, h) {
  var mat = _opencv4nodejs2.default.imdecode(Buffer.from(image, 'base64'));
  var croppedImage = mat.getRegion(new _opencv4nodejs2.default.Rect(x, y, w, h));
  return _opencv4nodejs2.default.imencode('.png', croppedImage).toString('base64');
};
