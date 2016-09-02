var express = require('express')
var path = require('path')
var app = express();


var EVENTS_FILE = path.join(__dirname, 'events.json');
app.use('/', express.static(path.join(__dirname, 'public')));

app.listen(3456, function () {
	console.log("Example app listenin on port 3456!");
});