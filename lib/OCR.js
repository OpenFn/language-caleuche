'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readText = readText;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function base64_encode(file) {
  var bitmap = _fs2.default.readFileSync(file);
  return new Buffer(bitmap).toString('base64');
}

function readText(imagePath, key) {

  var url = 'https://vision.googleapis.com/v1/images:annotate?key=' + key;

  console.log(imagePath);

  var json = {
    "requests": [{
      "image": { "content": base64_encode(imagePath) },
      "features": [{ "type": "TEXT_DETECTION" }]
    }]
  };

  return new Promise(function (resolve, reject) {
    _request2.default.post({ url: url, json: json }, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        console.log('\u2713 Google Vision OCR succeeded.');
        resolve(body);
      }
    });
  });
}
