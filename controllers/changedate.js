var connection = require('../connect');


exports.update = function (req, res, next) {

	var query = 'update today set today_date = ?';
	console.log("query " + query);
	console.log("hello there");
	connection.sync().then(function(){
		console.log("connected");
		connection.query(query,{replacements: [req.body.date]}).then(UpdateResults => {
			res.redirect("/");
 		});

	}).catch(function(){
		console.log("disconnected");
	})	
};