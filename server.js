var express = require('express');
var morgan = require('morgan');
var app = express();

var port = 2222;

app.use(morgan('dev'));
app.use(express.static(__dirname));

app.get('/', function(req, res) {
  res.sendFile(__dirname+'/index.html');
});
app.listen(port);

console.log('listening on '+port);