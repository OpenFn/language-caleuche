'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findInImage = findInImage;

var _opencv4nodejs = require('opencv4nodejs');

var _opencv4nodejs2 = _interopRequireDefault(_opencv4nodejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findInImage(waldo, scene) {
  return new Promise(function (resolve, reject) {

    var needle = _opencv4nodejs2.default.imread(waldo);
    _opencv4nodejs2.default.imwrite('tmp/img/1.png', needle);

    var haystack = _opencv4nodejs2.default.imread(scene);
    _opencv4nodejs2.default.imwrite('tmp/img/2.png', haystack);

    // Match template (the brightest locations indicate the highest match)
    var matched = haystack.matchTemplate(needle, 5);
    _opencv4nodejs2.default.imwrite('tmp/img/matched.png', matched);

    // Use minMaxLoc to locate the highest value (or lower, depending of the type of matching method)
    var minMax = matched.minMaxLoc();
    var _minMax$maxLoc = minMax.maxLoc,
        x = _minMax$maxLoc.x,
        y = _minMax$maxLoc.y;

    // Draw bounding rectangle

    haystack.drawRectangle(new _opencv4nodejs2.default.Rect(x, y, needle.cols, needle.rows), new _opencv4nodejs2.default.Vec(0, 255, 0), 2, _opencv4nodejs2.default.LINE_8);
    _opencv4nodejs2.default.imwrite('tmp/img/wheres_waldo.png', haystack);

    console.log(minMax.maxLoc);
    resolve(minMax.maxLoc);
  });
}
