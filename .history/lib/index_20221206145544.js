'use strict';
const { Storage } = require('@google-cloud/storage');
const { converter } = require('./converter');

// TODO: Add projectId to env
// TODO: // Get this from Google Cloud -> Credentials -> Service Accounts

module.exports = {
  init(config) {
    const storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.serviceAccount,
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
            ...config.uploadOption,
          };

          print(file);

          converter(filename, file.buffer, (err) => {
            if (err) {
              print('UPLOAD: Storage Error!', err);
              return reject(err);
            }
            bucket
              .makePublic()
              .then((res) => {
                bucket
                  .upload(filename, options)
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
          });
        });
      },
      delete(file) {
        return new Promise((resolve, reject) => {
          const filename = `${file.path ? `${file.path}/` : ''}${file.name}`;
          bucket
            .file(filename)
            .delete({ ...config.deleteOptions })
            .then((res) => {
              print('DELETE: Delete file Success!');
              resolve();
            })
            .catch((err) => {
              print('DELETE: Error!', err);
              return reject(err);
            });
        });
      },
    };
  },
};
