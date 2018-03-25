"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readText = readText;

var _request = require("request");

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function readText(image, key) {

  var url = "https://vision.googleapis.com/v1/images:annotate?key=" + key;

  var json = {
    "requests": [{
      "image": { "content": image },
      "features": [{ "type": "TEXT_DETECTION" }]
    }]
  };

  return new Promise(function (resolve, reject) {
    _request2.default.post({ url: url, json: json }, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        console.log("\u2713 Google Vision OCR succeeded.");
        resolve(body);
      }
    });
  });
}
