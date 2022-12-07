'use strict';
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

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

          fs.writeFile(
            path.join('../upload', `${file.hash}${file.ext}`),
            file.buffer,
            (err) => {
              if (err) {
                return reject(err);
              }

              file.url = `/${UPLOADS_FOLDER_NAME}/${file.hash}${file.ext}`;

              resolve();
            }
          );
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
