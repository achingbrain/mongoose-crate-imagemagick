var should = require("should"),
	crypto = require("crypto"),
	os = require("os"),
	fs = require("fs"),
	path = require("path"),
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
/*
	it("should process a png", function(done) {
		var processor = new ImageMagick({});
		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");

		processor.process(file, null, null, null, function(error) {
			if(error) {
				throw error;
			}

			done();
		});
	})
*/
	it("should not process text file", function(done) {
		var processor = new ImageMagick({});
		var file = path.resolve(__dirname + "/./fixtures/foo.txt");

		processor.process(file, null, null, null, function(error) {
			if(error) {
				throw error;
			}

			done();
		});
	})
})
