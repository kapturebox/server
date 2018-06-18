const crypto = require('crypto');
const path = require('path');
const prettyBytes = require('pretty-bytes');

const dest = require('../../dest');
const Plugin = require('../../plugin_handler/base');

// standard plugin metadata, and some additional flexget properties
class UploadHandler extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'com_kapturebox_uploader',     // Unique ID of plugin
      pluginName: 'Uploader',                  // Display name of plugin
      pluginTypes: ['downloader', 'uploader'], // 'source', 'downloader', 'player'
      link: 'http://kapturebox.com',           // Link to provider site
      description: 'Uploader plugin'           // Description of plugin provider
    };

    const defaultSettings = {
      enabled: true,
    };

    super(metadata, defaultSettings);
  }

  // we keep this around so that we can add the uploads to the
  // 'download' holistic list of all files in system
  status() {
    // handle ID if passed in optionally
    if(arguments[0]) {
      return this.getState(arguments[0]);
    } else {
      return this.getState();
    }  
  }

  uploadFile(file, where) {
    const self = this;
    
    return new Promise((resolve, reject) => {
      const fname = file.name;
      const basepath = dest.determineDest(where);
      const fullpath = path.join(basepath, fname);
      const id = crypto.createHash('sha1')
        .update(`${fullpath}`)
        .digest('hex');

      const saveObj = {
        id: id,
        fullPath: fullpath,
        title: fname,
        where: where,
        contentType: file.mimetype,
        size: prettyBytes(file.data.byteLength),
        sourceId: self.metadata.sourceId,
        sourceName: self.metadata.sourceName
      };

      file.mv(path.resolve(fullpath), function(err) {
        if (err)
          return reject(err);

        self.setState(id, saveObj);
    
        return resolve(saveObj);
      });
    });
  }
  
  removeDownloadId(id, fromDisk) {
    const self = this;

    return new Promise((resolve,reject) => {
      let canonical = self.getState(id);

      if(!canonical) {
        let err = new Error(`not found ${id}`);
        err.statusCode(404);
        throw err;
      }

      self.removeState(id);

      if(fromDisk) {
        fs.unlink(canonical.fullPath, (err) => {
          if(err) {
            return reject(err);
          }
          resolve(canonical);
        });
      } else {
        resolve(canonical);
      }
    });
  }



  downloadSlug(slug, where) {
    return Promise.reject(new Error('KaptureUploadPlugin.downloadSlug not yet implemented'));
  }


  removeSlug(slug) {
    return Promise.reject(new Error('KaptureUploadPlugin.removeSlug not yet implemented'));
  }
}

module.exports = UploadHandler;
