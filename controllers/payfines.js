var connection = require('../connect');


exports.search = function (req, res, next) {
	var SearchResults;
	res.render("payfines/index",{SearchResults : SearchResults});	
};

exports.index = function (req, res, next) {
	console.log("redirected " + req.body.search);
	var search_var = req.body.search.toLowerCase();
	console.log("search_var " + search_var);
	var query = ' select c.Card_id card_id, c.Bname bname, sum(b.fine_amt) fine_amt from  book_loan a ,fines b, borrower c where a.Card_id = c.Card_id and a.Loan_id = b.Loan_id and b.paid = "N" group by a.Card_id having lower(c.Card_id) like "%'+search_var+'%" or lower(c.Bname) like "%'+search_var+'%"';
	console.log("query " + query);

	connection.sync().then(function(){
		console.log("connected");
		connection.query(query).then(SearchResults => {
			res.render("payfines/index",{SearchResults : SearchResults[0]});
 		});

	}).catch(function(){
		console.log("disconnected");
	})	
};

exports.pay = function (req, res, next) {
	var card_id = req.params.card_id;
	var query = 'select count(Loan_id) cnt from book_loan a, borrower b where a.Card_id = b.Card_id and b.Card_id = ?  and Date_in is null';
	connection.query(query,{replacements: [card_id]}).then(UpdateRes =>{
		if(UpdateRes[0][0].cnt > 0){
			var infomsg = {
				type : 'E',
				msg : 'Borrower has a book checked out. So cannot pay fine right now. Please checkin the book and try again'
			};				
			res.render('info',{infomsg : infomsg});				
		}else{
			var query = 'update fines set PAID = "Y" where Loan_id in (select Loan_id from book_loan where Card_id = ?)';
			connection.query(query,{replacements: [card_id]}).then(UpdateRes =>{
				console.log(UpdateRes);
				var infomsg = {
					type : 'S',
					msg : 'Fine has been paid successfully'
				};				
				res.render('info',{infomsg : infomsg});											

			}).catch(function(){
				console.log('failed Update');
			})

		}


	}).catch(function(){
		console.log('failed Update');
	})	
};