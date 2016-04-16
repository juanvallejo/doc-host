#!/usr/bin/env node

// define consts
var PORT = 8000;
var HOST = '0.0.0.0';

var http = require('http');

var app = http.createServer(function(req, res) {

	res.end('Hello World');

});

app.listen(PORT, HOST);