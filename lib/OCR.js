'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readText = readText;

var _vision = require('@google-cloud/vision');

var _vision2 = _interopRequireDefault(_vision);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function readText(imagePath) {

  var client = new _vision2.default.ImageAnnotatorClient();
  var fileName = imagePath;

  client.documentTextDetection(fileName).then(function (results) {
    var fullTextAnnotation = results[0].fullTextAnnotation;
    console.log(fullTextAnnotation.text);
  }).catch(function (err) {
    console.error('ERROR:', err);
  });
}
