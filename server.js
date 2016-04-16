#!/usr/bin/env node

// define consts
var PORT = 8000;
var HOST = '0.0.0.0';

var http = require('http');
var api = require('./api.js');

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
		res.end('<form method="POST" action="/api/post" enctype="multipart/form-data"> \
			<input type="file" name="image" /> \
			<input type="submit" value="submit" /> \
		</form>');
	}
 
	res.writeHead(500);
	res.end(JSON.stringify({
	    "error": "true",
	    "message": "Invalid endpoint"
	}));

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