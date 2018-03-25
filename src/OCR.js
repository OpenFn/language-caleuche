import fs from 'fs';
import request from 'request'

function base64_encode(file) {
    var bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
}

export function readText(imagePath, key) {

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${key}`

  console.log(imagePath);

  const json = {
    "requests": [{
      "image": {"content": base64_encode(imagePath)},
      "features": [{"type": "TEXT_DETECTION"}]
    }]
  };

  return new Promise((resolve, reject) => {
    request.post({url, json}, function(error, response, body){
      if(error) {
        reject(error);
      } else {
        console.log(`✓ Google Vision OCR succeeded.`);
        resolve(body);
      }
    })
  })

}
