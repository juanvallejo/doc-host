var fs         = require('fs');
var spawn      = require('child_process').spawn;
var Multiparty = require('multiparty');
var db         = require('./db.js');
var atob = require('atob');

function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches && matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

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
            	console.log(req.headers);
                console.log('ERR MULTIPARTY', err);
                return callback.call(this, 'err_upload');
            }

            var length = 0;
            for(var i in files) {
            	length++;
            }

            if(!length) {
            	files = fields;
				// var base64Data = files.image[0].replace(/^data:image\/png;base64,/, "");
				console.log(files.image);
				decodeBase64Image(files.image[0]);
				// save file
                // fs.writeFile(__dirname + '/images/image.png', base64Data, 'base64', function(err) {
                // 	callback.call(this, null, {
	               //  	img_path: '/images/' + files.image[0].originalFilename,
	               //  	username: fields.username
	               //  });
                // });
            	return;
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
	                	img_path: '/images/' + files.image[0].originalFilename,
	                	username: fields.username
	                });
                });

            });

        });

	},

	receive_req: function(req, callback) {
		
		var data = '';

		req.on('data', function(chunk) {
			data += chunk;
		});

		req.on('end', function() {
			callback.call(this, null, data);
		});

		req.on('error', function(err) {
			callback.call(this, err.toString());
		});

	},

	post_img: function(req, res) {
		
		if(req.method != 'POST') {
			return api.respond_err(res, 'Invalid ');
		}

		var textpath = 'sample1.txt';
		api.extract_img_text(__dirname + '/doc.jpg', function(err, ocrData) {
			// save extracted text
			fs.writeFile(__dirname + textpath, ocrData, function(err) {

				api.respond_ok(res, null,
					{
						error: false,
						message: 'success',
						img_path: '/images/path',
						ocr_path: textpath,
						has_ocr: true,
						ocr: ocrData,
						published_at: Date.now()
					}
				);

			});
		});
		return;

		api.receive_res_multipart(req, function(err, data) {

			if(err) {
				return api.respond_err(res, err);
			}

			var textpath = data.img_path.split('.');
			textpath.pop();
			textpath = (textpath[0].replace('/images/', '/ocr/')) + '.txt';

			// save data to database
			db.insertInto('files', ['img_path', 'ocr_path', 'username'], [data.img_path, textpath, data.username[0]], function(err, rows) {
				console.log('Successfully saved image / text for user', data.username[0]);
			});

			// extract text from image
			api.extract_img_text(__dirname + data.img_path, function(err, ocrData) {

				// save extracted text
				fs.writeFile(__dirname + textpath, ocrData, function(err) {

					api.respond_ok(res, null,
						{
							error: false,
							message: 'success',
							img_path: data.img_path,
							ocr_path: textpath,
							has_ocr: true,
							ocr: ocrData,
							published_at: Date.now()
						}
					);

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
		var user = req.url.split('/');
		user = user[user.length - 1];

		db.selectFrom('files', ['*'], 'username="' + user + '"', function(err, rows) {
			api.respond_ok(res, null,
				{
					error: false,
					message: 'success',
					user: user,
					uploads: rows
				}
			);
		});

	}

};

module.exports = api;