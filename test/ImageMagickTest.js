var should = require("should"),
	crypto = require("crypto"),
	os = require("os"),
	fs = require("fs"),
	path = require("path"),
	sinon = require("sinon"),
	ImageMagick = require("../lib/ImageMagick");

function randomString(length) {
	return crypto.randomBytes(Math.ceil(length/2))
		.toString("hex")
		.slice(0, length);
}

describe("ImageMagick", function() {

	it("should object strenuously if options are not specified", function(done) {
		(function() {
			new ImageMagick();
		}).should.throw();

		done();
	})

	it("should process a png", function(done) {
		var processor = new ImageMagick({
			transforms: {
				original: {

				}
			}
		});

		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");
		var storageProvider = {
			save: sinon.stub()
		};
		storageProvider.save.callsArgWith(1, null, "http://foo.bar");

		processor.process({
			path: file
		}, storageProvider, {
			id: "model_id",
			original: {}
		}, function(error) {
			should(error).not.ok;

			done();
		});
	})

	it("should not process text file", function(done) {
		var processor = new ImageMagick({
			transforms: {
				original: {

				}
			}
		});
		var file = path.resolve(__dirname + "/./fixtures/foo.txt");

		processor.process(file, null, null, function(error) {
			should(error).ok;

			done();
		});
	})
})
