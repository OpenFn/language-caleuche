import cv from 'opencv4nodejs';

export function findInImage(waldo, scene) {
  return new Promise((resolve, reject) => {

    console.log("OpenCV...");

    const needle = cv.imread(waldo);
    cv.imwrite('tmp/img/1.png', needle);

    // Represent image a Mat...
    // const base64text='data:image/png;base64,R0lGO..';//Base64 encoded string
    // const base64data =base64text.replace('data:image/jpeg;base64','')
    //                             .replace('data:image/png;base64','');//Strip image type prefix
    const buffer = Buffer.from(scene,'base64');
    const haystack = cv.imdecode(buffer);

    // const haystack = cv.imread(scene);
    // cv.imwrite('tmp/img/2.png', haystack);

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

    console.log(minMax);
    if (minMax.maxVal > 0.85) {
      resolve(minMax.maxLoc);
    } else {
      reject("not strong enough.")
    }

  })

}
