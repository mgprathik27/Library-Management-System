var express = require('express');
var app = express();
var Sequelize = require('sequelize');
var bodyParser = require("body-parser");
var flash = require('connect-flash');
var connection = new Sequelize('library', 'root', 'prat27winneR',{
host: 'localhost',
dialect: 'mysql'
});

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static(__dirname+"/public"));
app.set("view engine","ejs");

app.get("/checkout/:isbn",function(req,res){
	console.log(req.params.isbn);
	res.render("checkout/checkout",{isbn : req.params.isbn});
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
				res.render('checkout/info',{infomsg : infomsg});

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
						res.render('checkout/info',{infomsg : infomsg});	
											
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
									res.render('checkout/info',{infomsg : infomsg});

								}else{
										console.log("Inserting into book_loans");
										query = 'insert into book_loan(Isbn, Card_id, Date_out,Due_date) values (?,?, curdate(), DATE_ADD(curdate(), INTERVAL 14 DAY))';
										connection.query(query,{replacements: [isbn,card_id]}).then(InsertRes =>{
											console.log(InsertRes);
											var infomsg = {
												type : 'S',
												msg : 'Book has been successfully checked out'
											};				
											res.render('checkout/info',{infomsg : infomsg});											

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

app.get("/",function(req,res){
	res.render("landingPage");
});

app.get("/checkout",function(req,res){
	res.render("checkout/index");
});

app.get("/checkin",function(req,res){
	res.render("checkin/index");
});

app.post("/checkout", function(req,res){
	console.log("redirected " + req.body.search);
	var search_var = req.body.search.toLowerCase();
	console.log("search_var " + search_var);
	var query = 'select  Isbn, Title, Authors from book where lower(Isbn) like "%'+search_var+'%" or lower(Title) like "%'+search_var+'%" or lower(Authors) like "%'+search_var+'%"';
	console.log("query " + query);

	connection.sync().then(function(){
		console.log("connected");
		connection.query(query).then(SearchResults => {
			res.render("checkout/show",{SearchResults : SearchResults[0]});
 		});

	}).catch(function(){
		console.log("disconnected");
	})
	
	
})

app.listen(8080,function(err){
	console.log("server has started");
})

