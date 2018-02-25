var connection = require('../connect');


module.exports = function (req, res, next) {
	var query = 'select today_date from today';
	connection.query(query).then(SelectRes =>{
		console.log(SelectRes[0][0].today_date);
		res.render('landingPage',{date : SelectRes[0][0].today_date});											

	}).catch(function(){
		console.log('failed Insert');
	})	
};