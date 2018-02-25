var connection = require('../connect');


exports.search = function (req, res, next) {
	var SearchResults;
	res.render("checkout/index",{SearchResults : SearchResults});	
};

exports.index = function (req, res, next) {
	console.log("redirected " + req.body.search);
	var search_var = req.body.search.toLowerCase();
	console.log("search_var " + search_var);

	var query = 'select Isbn, Title, Authors, Ind from ('+
					' select distinct a.Isbn, a.title, GROUP_CONCAT(c.name ORDER BY c.name ASC SEPARATOR ", ") authors, a.available as Ind from book a left join book_author b on a.Isbn = b.Isbn  left join authors c on b.author_id = c.author_id  group by a.Isbn  order by a.Isbn  ) d'+
					' where Isbn like "%'+search_var+'%" or Title like "%'+search_var+'%" or authors like "%'+search_var+'%" order by title';					
	console.log("query " + query);

	connection.sync().then(function(){
		console.log("connected");
		connection.query(query).then(SearchResults => {
			res.render("checkout/index",{SearchResults : SearchResults[0]});
 		});

	}).catch(function(){
		console.log("disconnected");
	})
};

exports.show = function (req, res, next) {
	console.log(req.params.isbn);
	query = 'select * from book where Isbn = ?';
	connection.query(query,{replacements: [req.params.isbn]}).then(QueryRes =>{
		console.log(QueryRes);
		res.render("checkout/checkout",{QueryRes : QueryRes[0][0]});										

	}).catch(function(){
		console.log('failed Insert');
	})
};

exports.borrow = function (req, res, next) {
	var isbn = req.params.isbn;
	var card_id = req.body.cardid;
	console.log(card_id);
	var query = 'select  1 as valid from borrower where Card_id = ?';
	connection.sync().then(function(){
		console.log("connected");
		connection.query(query, {replacements: [card_id]}).then(SearchResults => {
			console.log(SearchResults[0][0]);
			if(SearchResults[0][0] == undefined){
				console.log("Borrower Card Id number is not valid");		// Throw error
				var infomsg = {
					type : 'E',
					msg : 'Borrower Card Id number is not valid'
				};				
				res.render('info',{infomsg : infomsg});

			}else{
				console.log("borrower card number is found");
				query = 'select count(Loan_id) as borrowed_cnt from book_loan where Date_in is null and Card_id = ?';
				connection.query(query,{replacements: [card_id]}).then(count =>{
					console.log(count[0][0].borrowed_cnt);
					if(count[0][0].borrowed_cnt == 3){
						console.log("Already checked out 3 books, cannot checkout any more books");		// Throw error
						var infomsg = {
							type : 'E',
							msg : 'Cannot checkout any more books. This Card User has already checked out 3 books'
						};				
						res.render('info',{infomsg : infomsg});	
											
					}else{
							console.log("borrower card has checked out less than 3 books");
							query = 'select count(Loan_id) as borrowed_cnt from book_loan where Date_in is null and Isbn = ?';
							connection.query(query,{replacements: [isbn]}).then(available =>{
								console.log(available[0][0].borrowed_cnt);
								if(available[0][0].borrowed_cnt > 0){
									console.log("Book has been checked out already");		// Throw error
									var infomsg = {
										type : 'E',
										msg : 'This Book has been checked out already'
									};				
									res.render('info',{infomsg : infomsg});

								}else{
										console.log("Inserting into book_loans");
										query = 'insert into book_loan(Isbn, Card_id, Date_out,Due_date) values (?,?, (select today_date from today), DATE_ADD((select today_date from today), INTERVAL 14 DAY))';
										connection.query(query,{replacements: [isbn,card_id]}).then(InsertRes =>{
											console.log(InsertRes);
											var infomsg = {
												type : 'S',
												msg : 'Book has been successfully checked out'
											};				
											res.render('info',{infomsg : infomsg});											

										}).catch(function(){
											console.log('failed Insert');
										})									
								}
							}).catch(function(){
								console.log('failed');
							})						
		}
				}).catch(function(){
					console.log('failed');
				})
			}
 		});

	}).catch(function(){
		console.log("disconnected");
	})
};