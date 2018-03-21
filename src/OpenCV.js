import cv from 'opencv4nodejs';

export function findInImage(waldo, scene) {
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

  // Open result in new window
  cv.imwrite('tmp/img/wheres_waldo.png', haystack);
  // };

  // const method = cv.TM_SQDIFF;
  // const output = cv.matchTemplate(templ, method, img);
  // return new Promise( ( resolve, reject ) => {
  //   const image = cv.readImage( bPath, ( err, matrix ) => err ? reject( err ) : resolve( matrix ) );
  // })
  // return new Promise( ( resolve, reject ) => {
  //   const templ = cv.readImage( sPath, ( err, matrix ) => err ? reject( err ) : resolve( matrix ) );
  // })

  //
  // cv.readImage(bPath, function(err, im) {
  //   if (err) return console.error('error loading image');
  //   var output = im.matchTemplate(bPath, 3);
  //   var matches = output.templateMatches(0.80, 1.0, 5, false);
  //   console.log(matches);
  // })
}
