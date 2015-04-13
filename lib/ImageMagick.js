var fs = require('fs'),
  os = require('os'),
  path = require('path'),
  crypto = require('crypto'),
  mkdirp = require('mkdirp'),
  async = require('async'),
  gm = require('gm'),
  mmm = require('mmmagic'),
  Magic = mmm.Magic,
  check = require('check-types'),
  FileProcessor = require('mongoose-crate').FileProcessor

function randomString(length) {
  return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex')
    .slice(0, length)
}

const SUPPORTED_FORMATS = [
  'JPEG', 'PNG', 'GIF', 'TIFF'
]

var ImageMagick = function(options) {
  check.verify.object(options, 'Some options are required!')
  check.verify.object(options.transforms, 'Some transforms are required!')

  this._options = options

  if(!this._options.tmpDir) {
    this._options.tmpDir = os.tmpdir()
  }

  if(!this._options.formats) {
    this._options.formats = SUPPORTED_FORMATS
  }

  mkdirp(this._options.tmpDir, function(error) {
    if(error) {
      throw error
    }
  })

  this._magic = new Magic(mmm.MAGIC_MIME_TYPE)
}

ImageMagick.prototype.createFieldSchema = function() {
  var output = {}

  Object.keys(this._options.transforms).forEach(function(name) {
    output[name] = FileProcessor.prototype.createFieldSchema.call(this)
    output[name].format = String
    output[name].depth = Number
    output[name].width = Number
    output[name].height = Number
  })

  return output
}

ImageMagick.prototype.process = function(attachment, storageProvider, model, callback) {
  gm(attachment.path)
    .options({imageMagick: this._options})
    .identify(function(error, attributes) {
      if(!attributes || this._options.formats.indexOf(attributes.format) == -1) {
        return callback(new Error('File was not an image'))
    }

    var tasks = []

    Object.keys(this._options.transforms).forEach(function(name) {
      var transform = this._options.transforms[name]
      var extension = transform.format ? transform.format : path.extname(attachment.path)

      if(extension.substring(0, 1) != '.') {
        extension = '.' + extension
      }

      var outputFile = path.join(this._options.tmpDir,
          randomString(20) + extension
      )

      this._setUpTransform(attachment, transform, outputFile, tasks, model[name], storageProvider)
    }.bind(this))

    async.parallel(tasks, function(error) {
      callback(error)
    })
  }.bind(this))
}

ImageMagick.prototype._setUpConvertArgs = function(transform) {
  var args = []

  // each transform is made up of key/value pairs that we pass to convert
  Object.keys(transform).forEach(function(arg) {
    if(arg == 'format') {
      return
    }

    args.push('-' + arg)

    if(transform[arg] instanceof Array) {
      transform[arg].forEach(function (arg) {
        args.push(arg)
      })

      return
    }

    args.push(transform[arg])
  })

  return args
}

ImageMagick.prototype._setUpTransform = function(attachment, transform, outputFile, tasks, model, storageProvider) {
  var self = this

  tasks.push(function(callback) {
    async.waterfall([function(callback) {
      var args = self._setUpConvertArgs(transform)
      var processor = gm(attachment.path).options({imageMagick: this._options}).command('convert')
      processor.out.apply(processor, args).write(outputFile, callback)
    }, function(error) {
      var callback = arguments[arguments.length - 1]
      gm(outputFile).options({imageMagick: this._options}).identify(callback)
    }, function(attributes, callback) {
      fs.stat(outputFile, function(error, stats) {
        callback(error, outputFile, attributes, stats)
      })
    }, function(outputFile, attributes, stats, callback) {
      self._magic.detectFile(outputFile, function(error, mimeType) {
        callback(error, outputFile, attributes, stats, mimeType)
      })
    }, function(outputFile, attributes, stats, mimeType, callback) {
      storageProvider.save({
        path: outputFile,
        size: stats.size,
        type: mimeType
      }, function(error, url) {
        callback(error, outputFile, attributes, stats, mimeType, url)
      })
    }], function(error, outputFile, attributes, stats, mimeType, url) {
      model.format = attributes.format
      model.depth = attributes.depth
      model.width = attributes.size.width
      model.height = attributes.size.height
      model.size = stats.size
      model.url = url
      model.name = attachment.name
      model.type = mimeType

      callback(error)
    })
  })
}

ImageMagick.prototype.remove = function(storageProvider, model, callback) {
  var tasks = []

  Object.keys(this._options.transforms).forEach(function(name) {
    if(!model[name].url) {
      return
    }

    tasks.push(function(callback) {
      storageProvider.remove(model[name], callback)
    })
  })

  async.parallel(tasks, callback)
}

ImageMagick.prototype.willOverwrite = function(model) {
  var result = false

  Object.keys(this._options.transforms).forEach(function(name) {
    result = !!model[name].url
  })

  return result
}

module.exports = ImageMagick
