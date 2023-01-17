import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import express from 'express';
import formidable from 'formidable';
import fs from 'fs';
import firebase from './firebase.js';
import resize from './resize.js';

const app = express();
const PORT = 3000;
const bucket = 'gs://thumbnail-generator-ui.appspot.com/';
const childRef = 'images/';

app.get('/', (_req, res) => {
  res.send('GET from firebase functions!');
});

app.post('/image', (req, res) => {
  const form = formidable({ uploadDir: './uploads', keepExtensions: true });

  form.parse(req, (err, _fields, files) => {
    if (err) {
      console.error(err);
      return;
    }

    const imageData = {
      filepath: files[Object.keys(files)[0]]['filepath'],
      mimetype: files[Object.keys(files)[0]]['mimetype'],
      originalName: files[Object.keys(files)[0]]['originalFilename'],
    };

    resize(imageData?.filepath, 200, 200, imageData?.originalName);
    const thumbnailPath = `${new URL('../', import.meta.url).pathname}/${imageData?.originalName}`;

    fs.readFile(thumbnailPath, function (err, data) {
      if (err) {
        console.error(err);
      }

      const storage = getStorage(firebase, bucket);
      const storageRef = ref(storage, `${childRef}${imageData?.originalName}`);
      const metadata = {
        contentType: imageData?.mimetype,
        name: imageData?.originalName,
      };
      uploadBytes(storageRef, data, metadata).then(() => {
        getDownloadURL(storageRef).then((url) => res.json(url));
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});