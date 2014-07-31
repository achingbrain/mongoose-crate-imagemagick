var should = require('should'),
  path = require('path'),
  sinon = require('sinon'),
  ImageMagick = require('../lib/ImageMagick')

describe('ImageMagick', function() {

  it('should object strenuously if options are not specified', function(done) {
    (function() {
      new ImageMagick()
    }).should.throw()

    done()
  })

  it('should process a png', function(done) {
    var processor = new ImageMagick({
      transforms: {
        original: {

        }
      }
    })

    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')
    var storageProvider = {
      save: sinon.stub()
    }
    storageProvider.save.callsArgWith(1, null, 'http://foo.bar')

    var model = {
      id: 'model_id',
      original: {}
    }

    processor.process({
      path: file,
      mimeType: 'image/png',
      name: 'node_js_logo.png'
    }, storageProvider, model, function(error) {
      should(error).not.ok

      // should have populated meta data
      model.original.should.be.ok
      model.original.depth.should.equal(8)
      model.original.format.should.equal('PNG')
      model.original.height.should.equal(196)
      model.original.width.should.equal(574)
      model.original.type.should.equal('image/png')
      model.original.name.should.equal('node_js_logo.png')
      model.original.url.should.equal('http://foo.bar')

      // this can vary depending on file system...
      model.original.size.should.be.greaterThan(19000)

      done()
    })
  })

  it('should not process text file', function(done) {
    var processor = new ImageMagick({
      transforms: {
        original: {

        }
      }
    })
    var file = path.resolve(__dirname + '/./fixtures/foo.txt')

    processor.process(file, null, null, function(error) {
      should(error).ok

      done()
    })
  })

  it('should extend field schema', function(done) {
    var processor = new ImageMagick({
      transforms: {
        original: {

        }
      }
    })

    var schema = processor.createFieldSchema()
    schema.original.format.should.equal(String)
    schema.original.depth.should.equal(Number)
    schema.original.width.should.equal(Number)
    schema.original.height.should.equal(Number)

    done()
  })

  it('should transform a png', function(done) {
    var processor = new ImageMagick({
      transforms: {
        smaller: {
          'resize': '100x34',
          'format': 'jpg'
        }
      }
    })

    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')
    var storageProvider = {
      save: function(path, callback) {
        callback(null, path)
      }
    }

    var model = {
      id: 'model_id',
      smaller: {}
    }

    processor.process({
      path: file,
      mimeType: 'image/png',
      name: 'node_js_logo.png'
    }, storageProvider, model, function(error) {
      should(error).not.ok

      model.smaller.format.should.equal('JPEG')
      model.smaller.width.should.equal(100)
      model.smaller.height.should.equal(34)
      model.smaller.type.should.equal('image/jpeg')

      done()
    })
  })

  it('should remove all transforms', function(done) {
    var processor = new ImageMagick({
      transforms: {
        original: {

        },
        thumbnail: {

        }
      }
    })

    var storageProvider = {
      remove: sinon.stub()
    }
    storageProvider.remove.callsArg(1)

    processor.remove(storageProvider, {
      original: {
        url: 'foo'
      },
      thumbnail: {
        url: 'bar'
      }
    }, function() {
      storageProvider.remove.callCount.should.equal(2)

      done()
    })
  })

  it('should not remove transforms with no URL', function(done) {
    var processor = new ImageMagick({
      transforms: {
        original: {

        },
        thumbnail: {

        }
      }
    })

    var storageProvider = {
      remove: sinon.stub()
    }
    storageProvider.remove.callsArg(1)

    processor.remove(storageProvider, {
      original: {
        url: null
      },
      thumbnail: {
        url: 'bar'
      }
    }, function() {
      // only one url present..
      storageProvider.remove.callCount.should.equal(1)

      done()
    })
  })

  it('should say we will overwrite transforms', function() {
    var processor = new ImageMagick({
      transforms: {
        original: {

        },
        thumbnail: {

        }
      }
    })

    processor.willOverwrite({
      original: {
        url: 'foo'
      },
      thumbnail: {
        url: 'bar'
      }
    }).should.be.true
  })

  it('should say we will not overwrite transforms without URLs', function() {
    var processor = new ImageMagick({
      transforms: {
        original: {

        },
        thumbnail: {

        }
      }
    })

    processor.willOverwrite({
      original: {
        url: null
      },
      thumbnail: {
        url: null
      }
    }).should.be.false
  })
})
