import request from 'request'

export function readText(image, key) {

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${key}`

  const json = {
    "requests": [{
      "image": {"content": image},
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
