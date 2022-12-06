'use strict';
const { Storage } = require('@google-cloud/storage');

module.exports = {
  init(config) {
    const storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.serviceAccount,
    });
    admin.initializeApp({
      credential: admin.credential.cert(config.serviceAccount),
      storageBucket: config.bucketUrl,
      ...config.options,
    });
    const bucket = storage.bucket(config.bucketUrl);

    const print = (...args) => {
      if (config.debug) console.log(...args);
    };

    return {
      upload(file) {
        return new Promise((resolve, reject) => {
          const filename = `${file.path ? `${file.path}/` : ''}${file.name}`;

          const options = {
            destination: filename,
          };

          bucket
            .makePublic()
            .then((res) => {
              bucket
                .upload()
                .then((value) => {
                  const url = value[0].publicUrl();
                  file.url = url;
                  print('UPLOAD: Success!', url);
                  resolve();
                })
                .catch((err) => {
                  print('UPLOAD: Uploading Error!', err);
                  return reject(err);
                });
            })
            .catch((err) => {
              print('UPLOAD: Storage Error!', err);
              return reject(err);
            });
          bucket.file(filename).save(
            file.buffer,
            {
              public: true,
              contentType: file.mime,
              ...config.uploadOptions,
            },
            (err) => {
              if (err) {
                print('UPLOAD: Error!', err);
                return reject(err);
              }
              file.url = `https://storage.googleapis.com/${config.bucketUrl}/${filename}`;
              print('UPLOAD: Success!', file.url);
              resolve();
            }
          );
        });
      },
      delete(file) {
        return new Promise((resolve, reject) => {
          const filename = `${file.path ? `${file.path}/` : ''}${file.name}`;
          bucket.file(filename).delete({ ...config.deleteOptions }, (err) => {
            if (err) {
              print('DELETE: Error!', err);
              return reject(err);
            }
            print('DELETE: Success!');
            resolve();
          });
        });
      },
    };
  },
};
