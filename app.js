var express = require('express');
var app = express();
var Sequelize = require('sequelize');
var bodyParser = require("body-parser");
var connection = new Sequelize('library', 'root', 'prat27winneR',{
host: 'localhost',
dialect: 'mysql'
});

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static(__dirname+"/public"));
app.set("view engine","ejs");

app.get("/checkout/:isbn",function(req,res){
	console.log(req.params.isbn);
	query = 'select * from book where Isbn = ?';
	connection.query(query,{replacements: [req.params.isbn]}).then(QueryRes =>{
		console.log(QueryRes);
		res.render("checkout/checkout",{QueryRes : QueryRes[0][0]});										

	}).catch(function(){
		console.log('failed Insert');
	})	
	
});

app.post("/checkout/:isbn",function(req,res){
	isbn = req.params.isbn;
	card_id = req.body.cardid;
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
										query = 'insert into book_loan(Isbn, Card_id, Date_out,Due_date) values (?,?, curdate(), DATE_ADD(curdate(), INTERVAL 14 DAY))';
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
});

app.get("/checkin/:loan_id",function(req,res){
	var loan_id = req.params.loan_id;
	var query = 'update book_loan set Date_in = curdate() where Loan_id = ?';
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
})

app.get("/payfines/:card_id",function(req,res){
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
})

app.get("/createborrower",function(req,res){
	res.render("borrower/new");
})

app.post("/createborrower",function(req,res){
	var ssn = req.body.ssn;
	var name = req.body.name;
	var address = req.body.address;
	var phone = req.body.phone;
	var query = 'select substring(max(Card_id),3,6) as last_id from borrower';
	connection.query(query).then(LoanId =>{
		console.log(LoanId[0][0].last_id);
		var card_id = "ID"+(parseInt(1+LoanId[0][0].last_id) +1).toString().substring(1);
		console.log(card_id);
		query = 'select count(Card_id) as card_cnt from borrower where Ssn = ?';
		connection.query(query,{replacements: [ssn]}).then(BorrowerData =>{
			console.log(BorrowerData[0][0].card_cnt);
			if(BorrowerData[0][0].card_cnt > 0 ){
					console.log("SSN already exists");
					var infomsg = {
						type : 'E',
						msg : 'User with the SSN '+ ssn + ' already exists'
					};				
					res.render('info',{infomsg : infomsg});					
			}else{
			
				query = 'insert into borrower values (?,?,?,?,?)';
				connection.query(query,{replacements: [card_id, ssn, name, address, phone]}).then(InsertData =>{
					console.log(InsertData[0][0]);
					var loan_id = "ID"+(parseInt(1+LoanId[0][0].last_id) +1).toString().substring(1);
					console.log(loan_id);
					
					var infomsg = {
						type : 'S',
						msg : 'Borrower has been added successfully'
					};				
					res.render('info',{infomsg : infomsg});											

				}).catch(function(){
					console.log('failed Update');
				});										
			}
		}).catch(function(){
			console.log('failed Update');
		});		
	}).catch(function(){
		console.log('failed Update');
	})		
})

app.get("/",function(req,res){
	res.render("landingPage");
});

app.get("/checkout",function(req,res){
	var SearchResults;
	res.render("checkout/index",{SearchResults : SearchResults});
});

app.get("/checkin",function(req,res){
	var SearchResults;
	res.render("checkin/index",{SearchResults : SearchResults});
});

app.get("/updatefines",function(req,res){
	var query = 'update fines a, book_loan b set a.fine_amt = TIMESTAMPDIFF(DAY,B.DUE_DATE, CURDATE()) * 0.25 WHERE a.loan_id = b.loan_id and Date_in is null and Due_date < curdate()';
	connection.query(query).then(UpdateRes =>{
		console.log(UpdateRes);
		var query = 'insert into fines select Loan_id, TIMESTAMPDIFF(DAY,a.DUE_DATE, CURDATE()) * 0.25, "N" from book_loan a where not exists(select 1 from fines b  where b.loan_id = a.loan_id ) and a.Due_date < curdate() and Date_in is null';
		connection.query(query).then(InsertRes =>{
			console.log(InsertRes);
			var infomsg = {
				type : 'S',
				msg : 'Fines have been updated'
			};				
			res.render('info',{infomsg : infomsg});											

		}).catch(function(){
			console.log('failed Insert');
		})											

	}).catch(function(){
		console.log('failed Update');
	})	
});

app.get("/payfines",function(req,res){
	var SearchResults;
	res.render("payfines/index",{SearchResults : SearchResults});
})

app.post("/checkout", function(req,res){
	console.log("redirected " + req.body.search);
	var search_var = req.body.search.toLowerCase();
	console.log("search_var " + search_var);
	//var query = 'select Isbn, Title, Authors, Ind from (select  Isbn, Title, Authors, "N" as Ind from book a where (lower(Isbn) like "%'+search_var+'%" or lower(Title) like "%'+search_var+'%" or lower(Authors) like "%'+search_var+'%")  and exists (select 1 from book_loan b where a.Isbn = b.Isbn and b.Date_in is null) union select  Isbn, Title, Authors, "Y" as Ind from book a where (lower(Isbn) like "%'+search_var+'%" or lower(Title) like "%'+search_var+'%" or lower(Authors) like "%'+search_var+'%") and (exists (select 1 from book_loan b where a.Isbn = b.Isbn and b.Date_in is not null) or not exists (select 1 from book_loan b where a.Isbn = b.Isbn))) c order by Title';
/*	var query = 'select * from ('+
					' select Isbn, Title, Authors, "N" AS Ind from ('+
					' select distinct a.Isbn, a.title, GROUP_CONCAT(c.name ORDER BY c.name ASC SEPARATOR ", ") authors from book a left join book_author b on a.Isbn = b.Isbn  left join authors c on b.author_id = c.author_id  group by a.Isbn  order by a.Isbn  ) d'+
					' where (Isbn like "%'+search_var+'%" or Title like "%'+search_var+'%" or authors like "%'+search_var+'%") and EXISTS( SELECT 1 FROM book_loan e WHERE d.Isbn = e.Isbn AND e.Date_in IS NULL)'+
					' union'+
					' select Isbn, Title, Authors, "Y" AS Ind from ('+
					' select distinct a.Isbn, a.title, GROUP_CONCAT(c.name ORDER BY c.name ASC SEPARATOR ", ") authors from book a left join book_author b on a.Isbn = b.Isbn  left join authors c on b.author_id = c.author_id  group by a.Isbn  order by a.Isbn  ) d'+
					' where (Isbn like "%'+search_var+'%" or Title like "%'+search_var+'%" or authors like "%'+search_var+'%") and (exists (select 1 from book_loan e where d.Isbn = e.Isbn and e.Date_in is not null) or not exists (select 1 from book_loan e where d.Isbn = e.Isbn))) f'+
					' order by Title'; */	
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
	
	
})

app.post("/checkin", function(req,res){
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
	
	
})

app.post("/payfines", function(req,res){
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
	
	
})

app.post("/changedate",function(req,res){
	var query = 'update today set today_date = ?';
	console.log("query " + query);

	connection.sync().then(function(){
		console.log("connected");
		connection.query(query,{replacements: [req.body.date]}).then(UpdateResults => {
			res.redirect("/");
 		});

	}).catch(function(){
		console.log("disconnected");
	})
})

app.listen(8080,function(err){
	console.log("server has started");
})

