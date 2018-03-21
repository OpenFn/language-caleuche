import vision from '@google-cloud/vision';

export function readText(imagePath) {

  const client = new vision.ImageAnnotatorClient();
  const fileName = imagePath;

  client
    .documentTextDetection(fileName)
    .then(results => {
      const fullTextAnnotation = results[0].fullTextAnnotation;
      console.log(fullTextAnnotation.text);
    })
    .catch(err => {
      console.error('ERROR:', err);
    });

}
