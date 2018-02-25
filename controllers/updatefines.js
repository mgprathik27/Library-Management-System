var connection = require('../connect');


exports.update = function (req, res, next) {

	var query = 'update fines a, book_loan b set a.fine_amt = TIMESTAMPDIFF(DAY,B.DUE_DATE, (select today_date from today)) * 0.25 WHERE a.loan_id = b.loan_id and Date_in is null and Due_date < (select today_date from today)';
	connection.query(query).then(UpdateRes =>{
		console.log(UpdateRes);
		var query = 'insert into fines select Loan_id, TIMESTAMPDIFF(DAY,a.DUE_DATE, (select today_date from today)) * 0.25, "N" from book_loan a where not exists(select 1 from fines b  where b.loan_id = a.loan_id ) and a.Due_date < (select today_date from today) and Date_in is null';
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
};