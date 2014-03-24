var util = require("util"),
	fs = require("fs"),
	os = require("os"),
	path = require("path"),
	mkdirp = require("mkdirp"),
	async = require("async"),
	im = require('imagemagick'),
	FileProcessor = require("mongoose-crate").FileProcessor;

var ImageMagick = function(options) {
	FileProcessor.call(this);

	if(!options) {
		throw new Error("Some options are required!");
	}

	this._options = options;

	if(!this._options.tmpDir) {
		this._options.tmpDir = os.tmpdir();
	}
}
util.inherits(ImageMagick, FileProcessor);

ImageMagick.prototype.createFieldSchema = function() {
	var schema = FileProcessor.createFieldSchema.call(this);
	schema.format = String;
	schema.depth = String;
	schema.width = String;
	schema.height = String;

	return schema;
};

ImageMagick.prototype.process = function(file, stats, storageProvider, model, callback) {
	var tasks = [
		function(callback) {
			im.identify(file, callback);
		},
		function(attributes, callback) {
			if(!attributes) {
				return callback(new Error("File was not an image"));
			}

			callback();
		}
	];

	async.waterfall(tasks, callback);
/*

	im.identify(attachmentInfo.path, function(err, atts) {
		if(err) return cb(new Error('identify didn\'t work. Maybe imagemagick is not installed? "' + err + '"'));

		// if 'identify' fails, that probably means the file is not an image.
		var canTransform = !!atts && supportedDecodingFormats.indexOf(atts.format) != -1;
		var fileExt = path.extname(attachmentInfo.path);
		var styles = propertyOptions.styles || {};
		var styleNames = Object.keys(styles);

		var tasks = [];
		var stylesToReset = []; // names of the style that needs to be reset at the end of the process.
		styleNames.forEach(function(styleName) {
			var styleOptions = styles[styleName] || {};
			var finishConversion = function(styleFilePath, atts, cb) {
				var ext = path.extname(styleFilePath);
				var filenameId = options.filenameId ? selfModel[options.filenameId] : selfModel.id;

				if(propertyOptions.array) {
					filenameId = options.filenameId ? arrayEntryModel[options.filenameId] : arrayEntryModel.id;
				}

				var storageStylePath = path.join(options.directory, [filenameId, propertyName + "-" + styleName].join(options.idAsDirectory ? "/" : "-") + ext);

				fs.stat(styleFilePath, function(err, stats) {
					if(err) return cb(err);
					cb(null, {
						style: {
							name: styleName,
							options: styleOptions
						},
						filename: styleFilePath,
						stats: stats,
						propertyName: propertyName,
						model: selfModel,
						path: storageStylePath,
						defaultUrl: null, // let the storage assign this
						features: atts
					});
				});
			};
			var optionKeys = Object.keys(styleOptions);
			var transformationNames = [];
			optionKeys.forEach(function(transformationName) {
				if(transformationName.indexOf('$') != 0) {  // if is not special command, add it as an special transformation argument
					transformationNames.push(transformationName);
				}
			});
			if(optionKeys.length != 0) {
				if(canTransform) {
					var styleFileExt = styleOptions['$format'] ? ('.' + styleOptions['$format']) : fileExt;
					var styleFileName = path.basename(attachmentInfo.path, fileExt);
					styleFileName += '-' + styleName + styleFileExt;
					var styleFilePath = path.join(path.dirname(options.directory), styleFileName);
					var convertArgs = [attachmentInfo.path]; // source file name

					// add all the transformations args

					transformationNames.forEach(function(transformationName) {
						convertArgs.push('-' + transformationName);
						if (styleOptions[transformationName] instanceof Array) {
							styleOptions[transformationName].forEach(function (arg) {
								convertArgs.push(arg);
							});
						} else {
							convertArgs.push(styleOptions[transformationName]);
						}
					});

					convertArgs.push(styleFilePath);
					tasks.push(function(cb) {

						// invoke 'convert'
						im.convert(convertArgs, function(err, stdout, stderr) {
							if(err) return cb(err);

							// run identify in the styled image
							im.identify(styleFilePath, function(err, atts) {
								if(err) return cb(err);
								finishConversion(styleFilePath, atts, cb);
							});
						});

					}); // tasks.push
				} else {
					stylesToReset.push(styleName);
				}// if can decode
			} else {
				// keep the file as original
				tasks.push(function(cb) {
					finishConversion(attachmentInfo.path, atts, cb);
				});
			}

		}); // for each style

		async.parallel(tasks, function(err, convertResults) {
			if(err) return cb(err);

			//console.log(convertResults);
			tasks = [];
			convertResults.forEach(function(convertResult) {
				tasks.push(function(cb) {

					// tell the provider to create or replace the attachment
					providerInstance.createOrReplace(convertResult, function(err, attachment) {
						if(err) return cb(err);
						cb(null, attachment);
					});

				});
			});

			async.parallel(tasks, function(err, storageResults) {
				if(err) return cb(err);

				// Finally Update the Model
				var propModel = selfModel[propertyName];

				if(propertyOptions.array) {
					propModel = arrayEntryModel;
				}

				if(storageResults.length > 0) { // only update the model if a transformation was performed.
					storageResults.forEach(function(styleStorage) {
						var modelStyle = propModel[styleStorage.style.name];
						modelStyle.defaultUrl = styleStorage.defaultUrl;
						modelStyle.path = styleStorage.path;
						modelStyle.size = styleStorage.stats.size;
						modelStyle.mime = styleStorage.mime;
						modelStyle.ctime = styleStorage.stats.ctime;
						modelStyle.mtime = styleStorage.stats.mtime;
						modelStyle.oname = attachmentInfo.name; // original name of the file
						if(atts) {
							modelStyle.format = styleStorage.features.format;
							modelStyle.depth = styleStorage.features.depth;
							modelStyle.dims.h = styleStorage.features.height;
							modelStyle.dims.w = styleStorage.features.width;
						}
					});

					if(propertyOptions.array) {
						selfModel[propertyName].push(propModel);
					}
				}

				stylesToReset.forEach(function(resetStyleName) {
					var path = [propertyName, resetStyleName].join('.');
					selfModel.set(path, null);
				});

				cb(null);
			});

		});
	});
















	storageProvider.createOrUpdate(path, function(error, url) {
		if(error) {
			return callback(error);
		}

		model.url = url;

		callback();
	});*/
};

module.exports = ImageMagick;
