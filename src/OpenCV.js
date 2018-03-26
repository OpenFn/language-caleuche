import cv from 'opencv4nodejs';

export function findInImage(waldo, scene) {
  return new Promise((resolve, reject) => {

    const needle = cv.imdecode(Buffer.from(waldo,'base64'));
    const haystack = cv.imdecode(Buffer.from(scene,'base64'));

    // Match template (the brightest locations indicate the highest match)
    const matched = haystack.matchTemplate(needle, 5);

    // Use minMaxLoc to locate the highest value (or lower, depending of the type of matching method)
    const minMax = matched.minMaxLoc();
    const { maxLoc: { x, y } } = minMax;

    // Draw bounding rectangle
    haystack.drawRectangle(
      new cv.Rect(x, y, needle.cols, needle.rows),
      new cv.Vec(0, 255, 0),
      2,
      cv.LINE_8
    );
    cv.imwrite('tmp/img/wheres_waldo.png', haystack);

    const target = {
      y: (Math.floor(minMax.maxLoc.y + needle.rows/2)),
      x: (Math.floor(minMax.maxLoc.x + needle.cols/2))
    };

    if (minMax.maxVal > 0.85) {
      resolve({target, minMax});
    } else {
      reject("No match found: " + JSON.stringify(minMax))
    }

  })

}

export function cropImage(image, x, y, w, h) {
  const mat = cv.imdecode(Buffer.from(image,'base64'));
  const croppedImage = mat.getRegion(new cv.Rect(x, y, w, h));
  cv.imwrite('tmp/img/cropped.png', croppedImage);
  return cv.imencode('.png', croppedImage).toString('base64');
};
