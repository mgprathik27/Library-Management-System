var connection = require('../connect');


exports.search = function (req, res, next) {
	var SearchResults;
	res.render("checkin/index",{SearchResults : SearchResults});
};

exports.index = function (req, res, next) {
	console.log("redirected " + req.body.search);
	var search_var = req.body.search.toLowerCase();
	console.log("search_var " + search_var);
	var query = 'select loan_id, Isbn, Card_id, Date_out, Due_date from book_loan b where Date_in is null and (lower(Isbn) like "%'+search_var+'%" or lower(Card_id) like "%'+search_var+'%" or exists(select 1 from borrower a where a.Card_id = b.Card_id and lower(Bname) like "%'+search_var+'%"))';
	console.log("query " + query);

	connection.sync().then(function(){
		console.log("connected");
		connection.query(query).then(SearchResults => {
			res.render("checkin/index",{SearchResults : SearchResults[0]});
 		});

	}).catch(function(){
		console.log("disconnected");
	})
};

exports.return = function (req, res, next) {
	var loan_id = req.params.loan_id;
	var query = 'update book_loan set Date_in = (select today_date from today) where Loan_id = ?';
	connection.query(query,{replacements: [loan_id]}).then(UpdateRes =>{
		console.log(UpdateRes);
		var infomsg = {
			type : 'S',
			msg : 'Book has been successfully checked in'
		};				
		res.render('info',{infomsg : infomsg});											

	}).catch(function(){
		console.log('failed Update');
	})	
};