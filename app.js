var express = require('express');
var app = express();
var Sequelize = require('sequelize');
var bodyParser = require("body-parser");
var connection = require('./connect');
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static(__dirname+"/public"));
app.set("view engine","ejs");

var router = require("./router");
app.use('/', router);

app.listen(8080,function(err){
	console.log("server has started");
})

