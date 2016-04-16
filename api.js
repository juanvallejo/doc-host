var fs = require('fs');
var spawn = require('child_process').spawn;
var Multiparty = require('multiparty');
var sqlite = require('sqlite3');

var procs = [];

var api = {

	respond_err: function(res, msg) {
		res.writeHead(500, {'Content-Type': 'application/json'});
		res.end(JSON.stringify({
			"error": "true",
			"message": (msg || '')
		}));
	},

	respond_ok: function(res, msg, data) {

		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify({
			"error": "false",
			"message": (msg || "success"),
			"uploads": (data || [])
		}));

		
	},

	receive_res_multipart: function(req, callback) {

		var form = new Multiparty.Form();
        return form.parse(req, function(err, fields, files) {

            if(err) {
                console.log('ERR MULTIPARTY', err);
                return callback.call(this, 'err_upload');
            }

            if(!files.image) {
                console.log('Unexpected fileformname from client.');
                return callback.call(this, 'err_filename');
            }

            fs.readFile(files.image[0].path, function(err, data) {

                if(err) {
                    console.log('ERR MULTIPART', err);
                    return callback.call(this, 'err_read_uploaded_file');
                }

                // save file
                fs.writeFile(__dirname + '/images/' + files.image[0].originalFilename, data, function(err) {
                	callback.call(this, null, {
	                	img_path: '/images/' + files.image[0].originalFilename
	                });
                });

            });

        });

	},

	post_img: function(req, res) {
		
		if(req.method != 'POST') {
			return api.respond_err(res, 'Invalid ');
		}

		api.receive_res_multipart(req, function(err, data) {

			if(err) {
				return api.respond_err(res, err);
			}

			// extract text from image
			api.extract_img_text(__dirname + data.img_path, function(err, ocrData) {

				// save extracted text
				var textpath = data.img_path.split('.');
				textpath.pop();
				textpath = (textpath[0].replace('/images/', '/ocr/')) + '.txt';
				console.log('writing file to ' + __dirname + textpath);
				fs.writeFile(__dirname + textpath, ocrData, function(err) {

					api.respond_ok(res, null, [
						{
							img_path: data.img_path,
							ocr_path: textpath,
							has_ocr: true,
							ocr: ocrData,
							published_at: Date.now()
						}
					]);

				});
			});

		});

	},

	extract_img_text: function(source_path, callback) {

		var proc = spawn('python', ['cloudvisreq.py', 'AIzaSyAsDsxqGvG7Ou5Wey0hjCAwDJ1vStsMxgo', source_path]);

		proc.stdout.on('data', function(data) {
			callback.call(this, null, data.toString().split('Text:\n')[1]);
		});
	},

	search_img: function(req, res) {
		res.end('test');
	},

	get_user_img: function(req, res) {
		res.end('test');
	}

};

module.exports = api;