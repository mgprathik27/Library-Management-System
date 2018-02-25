var connection = require('../connect');


exports.new = function (req, res, next) {
	res.render("borrower/new");
};

exports.create = function (req, res, next) {
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
					console.log(InsertData);
					var infomsg = {
						type : 'S',
						msg : 'Borrower has been added successfully. New Card ID generated is '+ card_id
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
};

