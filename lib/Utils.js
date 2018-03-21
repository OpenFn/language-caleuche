"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPath = getPath;
function getPath(state, image) {
  return "./" + state.path_to_images + "/" + image;
};
