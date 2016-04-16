#!/usr/bin/env node

// define consts
var PORT = 8000;
var HOST = '0.0.0.0';

var fs = require('fs');
var http = require('http');
var api = require('./api.js');

var dictionaryOfMimeTypes = {

    'css'   : 'text/css'                ,
    'html'  : 'text/html'               ,
    'ico'   : 'image/x-icon'            ,
    'jpg'   : 'image/jpeg'              ,
    'jpeg'  : 'image/jpeg'              ,
    'js'    : 'application/javascript'  ,
    'map'   : 'application/x-navimap'   ,
    'pdf'   : 'application/pdf'         ,
    'png'   : 'image/png'               ,
    'ttf'   : 'application/octet-stream',
    'txt'   : 'text/plain'              ,
    'woff'  : 'application/x-font-woff'

};

var api_routes = {
	'/api/post': {
		fn: api.post_img
	},

	'/api/search': {
		fn: api.search_img
	},

	'/api/user': {
		fn: api.get_user_img
	}
};

var app = http.createServer(function(req, res) {

	var match = match_req(req);
	if(api_routes[match]) {
		return api_routes[match].fn(req, res);
	}

	if(req.url == '/') {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		return res.end('<form method="POST" action="/api/post" enctype="multipart/form-data"> \
			<input type="file" name="image" /><br /> \
			<input type="text" name="username" placeholder="Enter your username" /> \
			<input type="submit" value="submit" /> \
		</form>');
	}
 
	fs.readFile(__dirname + req.url, function(err, data) {
		
		if(err) {
			res.writeHead(500);
			return res.end(JSON.stringify({
			    "error": "true",
			    "message": "Invalid endpoint"
			}));
		}

		var ext = req.url.split('.');
		ext = ext[ext.length - 1];
		res.writeHead(200, {'Content-Type': dictionaryOfMimeTypes[ext]});
		res.end(data);

	});

}); 

function match_req(req) {

	var response = req.url;

	if(req.url.match(/^\/api\/post(\/)?/gi)) {
		response = "/api/post";
	}
	if(req.url.match(/^\/api\/search\/.*/)) {
		response = "/api/search";	
	}

	if(req.url.match(/\/api\/user\/.*/gi)) {
		response = "/api/user";	
	}

	return response;
}

app.listen(PORT, HOST);