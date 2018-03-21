import cv from 'opencv4nodejs';

export function findInImage(waldo, scene) {
  return new Promise((resolve, reject) => {

    const needle = cv.imread(waldo);
    cv.imwrite('tmp/img/1.png', needle);

    const haystack = cv.imread(scene);
    cv.imwrite('tmp/img/2.png', haystack);

    // Match template (the brightest locations indicate the highest match)
    const matched = haystack.matchTemplate(needle, 5);
    cv.imwrite('tmp/img/matched.png', matched);

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

    console.log(minMax.maxLoc);
    resolve(minMax.maxLoc);

  })

}
