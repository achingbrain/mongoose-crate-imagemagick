# mongoose-crate-imagemagick

[![Dependency Status](https://david-dm.org/achingbrain/mongoose-crate-imagemagick.svg?theme=shields.io)](https://david-dm.org/achingbrain/mongoose-crate-imagemagick) [![devDependency Status](https://david-dm.org/achingbrain/mongoose-crate-imagemagick/dev-status.svg?theme=shields.io)](https://david-dm.org/achingbrainmongoose-crate-imagemagick#info=devDependencies) [![Build Status](https://img.shields.io/travis/achingbrain/mongoose-crate-imagemagick/master.svg)](https://travis-ci.org/achingbrain/mongoose-crate-imagemagick) [![Coverage Status](http://img.shields.io/coveralls/achingbrain/mongoose-crate-imagemagick/master.svg)](https://coveralls.io/r/achingbrain/mongoose-crate-imagemagick)

A mongoose-crate FileProcessor that applies image transformations with ImageMagick.

## Prequisites

A modern version of ImageMagick installed and available on the path.  You may also need GhostScript, I did on one computer but not on another.  YMMV.

## Usage

You can pass images through one or more ImageMagick filters:

```javascript
var mongoose = require('mongoose'),
  crate = require("mongoose-crate"),
  LocalFS = require("mongoose-crate-localfs"),
  ImageMagick = require("mongoose-crate-imagemagick");

var PostSchema = new mongoose.Schema({
  title: String,
  description: String
});

PostSchema.plugin(crate, {
  storage: new LocalFS({
    directory: "/path/to/storage/directory"
  }),
  fields: {
    image: {
      processor: new ImageMagick({
        tmpDir: "/tmp", // defaults to os.tmpdir()
        formats: ["JPEG", "GIF", "PNG"], // defaults to jpgs, gifs, pngs and tiffs
        transforms: {
          original: {
            // keep the original file
          },
          small: {
            resize: '150x150',
            format: '.jpg'
          },
          medium: {
            resize: '250x250',
            format: '.jpg'
          }
        }
      })
    }
  }
});

var Post = mongoose.model('Post', PostSchema);
```

.. then later:

```javascript
var post = new Post();
post.attach("image", {path: "/path/to/image"}, function(error) {
	// image is now attached and post.image is populated e.g.:
	// post.image.small.url
	// post.image.medium.url
});
```

### Metadata

When mongoose-crate-imagemagick extends the basic meta data added by mongoose-crate to add some image specific fields.  It provides the following for each transformation:

Example:

```javascript
{
  "width" : 120,
  "height: 103,
  "depth" : 8,
  "format" : "PNG",
  "name" : "dragon.png",
  "size" : 26887,
  "url" : "http://my_bucket.s3.amazonaws.com/folder/4fbaaa31db8cec0923000019-medium.png"
}
```

### Styles and ImageMagick Transformations

Transformations are achieved by invoking the **convert** command from ImageMagick and passing all the properties of the style as arguments.

For more information about convert, take a look at http://www.imagemagick.org/script/command-line-options.php

Example in convert command:

    convert source.png -resize '50%' output.png

Example in plugin options:

```javascript
transforms: {
  small: {
    resize: '50%'
  }
}
```

#### Multiple Transformations

Use another properties under the style to provide more transformations

```javascript
transforms: {
  small: {
    crop: '120x120',
    blur: '5x10' //radius x stigma
  }
}
```

More information about 'blur' at the [ImageMagick website] http://www.imagemagick.org/script/command-line-options.php#blur

#### Changing the Destination Format

You can change the destination format by using the special transformation '$format' with a known file extension like *png*, *jpg*, *gif*, etc.

Example:

```
transforms: {
  as_jpeg: {
    'format': 'jpg'
  }
}
```

#### Supported Formats

There are two possibilities to define which file formats should be supported:

1. White list (default)
2. Formats listed with certain flags by `convert -list format`

##### White List

The default white list contains:

* PNG
* GIF
* TIFF
* JPEG

To add a format call the following method before using the plugin in the mongoose schema:

```javascript
attachments.registerDecodingFormat('BMP');
```
