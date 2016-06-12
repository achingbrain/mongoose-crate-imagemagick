'use strict'

const should = require('should')
const path = require('path')
const sinon = require('sinon')
const ImageMagick = require('../')
const describe = require('mocha').describe
const it = require('mocha').it

describe('ImageMagick', () => {
  it('should object strenuously if options are not specified', (done) => {
    (() => new ImageMagick()).should.throw()

    done()
  })

  it('should throw if creating the temp dir fails', (done) => {
    (() => new ImageMagick({
      tmpDir: 5,
      transforms: {
        original: {

        }
      }
    })).should.throw()

    done()
  })

  it('should override formats', () => {
    const im = new ImageMagick({
      transforms: {
        original: {

        }
      },
      formats: ['png']
    })

    im._options.formats.should.containEql('png')
  })

  it('should process a png', (done) => {
    const processor = new ImageMagick({
      transforms: {
        original: {

        }
      }
    })

    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))
    const storageProvider = {
      save: sinon.stub()
    }
    storageProvider.save.callsArgWith(1, null, 'http://foo.bar')

    const model = {
      id: 'model_id',
      original: {}
    }

    processor.process({
      path: file,
      mimeType: 'image/png',
      name: 'node_js_logo.png'
    }, storageProvider, model, (error) => {
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

  it('should pass an error to the callback when asked to process an unsupported format', (done) => {
    const processor = new ImageMagick({
      transforms: {
        original: {

        }
      }
    })

    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'foo.txt'))
    const storageProvider = {
      save: sinon.stub()
    }
    storageProvider.save.callsArgWith(1, null, 'http://foo.bar')

    const model = {
      id: 'model_id',
      original: {}
    }

    processor.process({
      path: file,
      mimeType: 'image/png',
      name: 'node_js_logo.png'
    }, storageProvider, model, (error) => {
      error.message.should.containEql('File was not an image')

      done()
    })
  })

  it('should not process text file', (done) => {
    const processor = new ImageMagick({
      transforms: {
        original: {

        }
      }
    })
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'foo.txt'))

    processor.process(file, null, null, (error) => {
      should(error).ok

      done()
    })
  })

  it('should extend field schema', (done) => {
    const processor = new ImageMagick({
      transforms: {
        original: {

        }
      }
    })

    const schema = processor.createFieldSchema()
    schema.original.format.should.equal(String)
    schema.original.depth.should.equal(Number)
    schema.original.width.should.equal(Number)
    schema.original.height.should.equal(Number)

    done()
  })

  it('should transform a png', (done) => {
    const processor = new ImageMagick({
      transforms: {
        smaller: {
          'resize': '100x34',
          'format': 'jpg'
        }
      }
    })

    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))
    const storageProvider = {
      save: (path, callback) => {
        callback(null, path)
      }
    }

    const model = {
      id: 'model_id',
      smaller: {}
    }

    processor.process({
      path: file,
      mimeType: 'image/png',
      name: 'node_js_logo.png'
    }, storageProvider, model, (error) => {
      should(error).not.ok

      model.smaller.format.should.equal('JPEG')
      model.smaller.width.should.equal(100)
      model.smaller.height.should.equal(34)
      model.smaller.type.should.equal('image/jpeg')

      done()
    })
  })

  it('should remove all transforms', (done) => {
    const processor = new ImageMagick({
      transforms: {
        original: {

        },
        thumbnail: {

        }
      }
    })

    const storageProvider = {
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
    }, () => {
      storageProvider.remove.callCount.should.equal(2)

      done()
    })
  })

  it('should not remove transforms with no URL', (done) => {
    const processor = new ImageMagick({
      transforms: {
        original: {

        },
        thumbnail: {

        }
      }
    })

    const storageProvider = {
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
    }, () => {
      // only one url present..
      storageProvider.remove.callCount.should.equal(1)

      done()
    })
  })

  it('should say we will overwrite transforms', () => {
    const processor = new ImageMagick({
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

  it('should say we will not overwrite transforms without URLs', () => {
    const processor = new ImageMagick({
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

  it('should support passing an array of args to convert', () => {
    const processor = new ImageMagick({
      transforms: {
        original: {

        }
      }
    })

    const args = processor._setUpConvertArgs({
      foo: ['bar', 'baz']
    })

    args.should.deepEqual(['-foo', 'bar', 'baz'])
  })
})
