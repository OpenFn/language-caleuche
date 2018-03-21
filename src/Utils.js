export function getPath(state, image) {
  return `./${state.path_to_images}/${image}`
};

export function screenshot(driver, output) {
  driver.takeScreenshot().then(
    function(image, err) {
      require('fs').writeFile(output, image, 'base64', function(err) {
        console.log(err);
      });
    }
  );
}
