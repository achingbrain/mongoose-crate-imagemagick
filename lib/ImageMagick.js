'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const mkdirp = require('mkdirp')
const async = require('async')
const im = require('imagemagick')
const mmm = require('mmmagic')
const Magic = mmm.Magic
const check = require('check-types')
const FileProcessor = require('mongoose-crate').FileProcessor

const randomString = (length) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}

const SUPPORTED_FORMATS = [
  'JPEG', 'PNG', 'GIF', 'TIFF'
]

class ImageMagick {
  constructor (options) {
    check.assert.object(options, 'Some options are required!')
    check.assert.object(options.transforms, 'Some transforms are required!')

    this._options = options

    if (!this._options.tmpDir) {
      this._options.tmpDir = os.tmpdir()
    }

    if (!this._options.formats) {
      this._options.formats = SUPPORTED_FORMATS
    }

    mkdirp(this._options.tmpDir, (error) => {
      if (error) {
        throw error
      }
    })

    this._magic = new Magic(mmm.MAGIC_MIME_TYPE)
  }

  createFieldSchema () {
    const output = {}

    Object.keys(this._options.transforms).forEach((name) => {
      output[name] = FileProcessor.prototype.createFieldSchema.call(this)
      output[name].format = String
      output[name].depth = Number
      output[name].width = Number
      output[name].height = Number
    })

    return output
  }

  process (attachment, storageProvider, model, callback) {
    im.identify(attachment.path, (error, attributes) => {
      if (error) {
        return callback(error)
      }

      if (!attributes || this._options.formats.indexOf(attributes.format) === -1) {
        return callback(new Error('File was not an image'))
      }

      const tasks = []

      Object.keys(this._options.transforms).forEach((name) => {
        const transform = this._options.transforms[name]
        let extension = transform.format ? transform.format : path.extname(attachment.path)

        if (extension.substring(0, 1) !== '.') {
          extension = '.' + extension
        }

        const outputFile = path.join(this._options.tmpDir,
            randomString(20) + extension
        )

        this._setUpTransform(attachment, transform, outputFile, tasks, model[name], storageProvider)
      })

      async.parallel(tasks, (error) => {
        callback(error)
      })
    })
  }

  _setUpConvertArgs (transform) {
    const args = []

    // each transform is made up of key/value pairs that we pass to convert
    Object.keys(transform).forEach((arg) => {
      if (arg === 'format') {
        return
      }

      args.push('-' + arg)

      if (transform[arg] instanceof Array) {
        transform[arg].forEach((arg) => {
          args.push(arg)
        })

        return
      }

      args.push(transform[arg])
    })

    return args
  }

  _setUpTransform (attachment, transform, outputFile, tasks, model, storageProvider) {
    const self = this

    tasks.push((callback) => {
      async.waterfall([(callback) => {
        var args = [attachment.path].concat(self._setUpConvertArgs(transform))
        args.push(outputFile)

        im.convert(args, callback)
      }, (stdout, stderr, callback) => {
        im.identify(outputFile, callback)
      }, (attributes, callback) => {
        fs.stat(outputFile, (error, stats) => {
          callback(error, outputFile, attributes, stats)
        })
      }, (outputFile, attributes, stats, callback) => {
        self._magic.detectFile(outputFile, (error, mimeType) => {
          callback(error, outputFile, attributes, stats, mimeType)
        })
      }, (outputFile, attributes, stats, mimeType, callback) => {
        storageProvider.save({
          path: outputFile,
          size: stats.size,
          type: mimeType
        }, (error, url) => {
          callback(error, outputFile, attributes, stats, mimeType, url)
        })
      }], (error, outputFile, attributes, stats, mimeType, url) => {
        model.format = attributes.format
        model.depth = attributes.depth
        model.width = attributes.width
        model.height = attributes.height
        model.size = stats.size
        model.url = url
        model.name = attachment.name
        model.type = mimeType

        callback(error)
      })
    })
  }

  remove (storageProvider, model, callback) {
    const tasks = []

    Object.keys(this._options.transforms).forEach((name) => {
      if (!model[name].url) {
        return
      }

      tasks.push((callback) => {
        storageProvider.remove(model[name], callback)
      })
    })

    async.parallel(tasks, callback)
  }

  willOverwrite (model) {
    let result = false

    Object.keys(this._options.transforms).forEach((name) => {
      result = !!model[name].url
    })

    return result
  }
}

module.exports = ImageMagick
