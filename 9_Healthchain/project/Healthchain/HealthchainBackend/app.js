const express = require('express');
const mysql = require('mysql');
const crypto = require('crypto');
const cron = require('node-cron');
var path = require("path");
const getTransactionCount = require("./transaction-utils/transactions").getTransactionCount;
const getRawTransaction = require("./transaction-utils/transactions").getRawTransaction;
const signTransaction = require("./transaction-utils/transactions").signTransaction;
const get_presc = require("./transaction-utils/transactions").get_presc;
const send = require("./transaction-utils/transactions").send;

//Create connection
const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'healthchain'
});

//Connect
db.connect((err) => {
	if(err){
		throw err;
	}
	console.log('MySql Connected..');
 
}); 

const app =express();
cron.schedule("10 */1 * * *",function(){
	let sql= "SELECT * from active_prescription";
	let query =db.query(sql,async (err,results)=>{
		if(err) throw err;
		for (var i = 0; i< results.length;  i++) {
			var time_stamp_data = new Date(results[i].time_stamp);
			var time_now = new Date();
			var diff = (time_now - time_stamp)/60000;
			console.log(diff);
			if (diff > 60){
				let sql1= "Delete from active_prescription where prescription_id=?";
				let sql2= "Delete from active_request where patient_id=? AND doctor_id=?";
				let query =db.query(sql1,[results[i].prescription_id],async (err,results)=>{
					if(err) throw err;	
				});
				let query =db.query(sql2,[results[i].patient_id,results[i].doctor_id],async (err,results)=>{
					if(err) throw err;	
				});
			}

		}
	});
});
app.get('/', function(request, response) {
	//response.sendFile(path.join(__dirname + '/default/Signin.html'));
	response.send("<h1>Hello World</h1>");
});
/*app.get('/uploadpresc',(req,res)=>{
	let sql= "SELECT p.PatientEmail, p.DoctorEmail, p.prescription_id FROM prescription p INNER JOIN blockchain_active b ON p.prescription_id = b.prescription_id;";
	let query =db.query(sql,(err,results)=>{
		if(err) throw err;
		console.log(results);
		
		res.send('Posts Fetched..');
	});

});
*/

app.get('/uploadpresc', async (req,res)=>{
	//var flag=0;
	console.log("Request:");
	console.log(req.query.send);
	let sql= "SELECT * FROM prescription where prescription_id=?;";
	//var document_id;
	let query =db.query(sql,[req.query.send],async (err,results)=>{
		if(err) throw err;
		console.log(results);
		console.log(results[0].prescription_id);
		document_id=results[0].prescription_id;
		patient_id=results[0].patient_id;
		var prescription_data=JSON.stringify(results);
		//var hash= await Transactionn_connect(prescription_data,results[0].prescription_id);
		//console.log(Transactionn_connect(prescription_data,results[0].prescription_id));
		var nonce = await getTransactionCount();
		var rawTransaction = await getRawTransaction(
	        nonce,
	        prescription_data,
	        results[0].prescription_id
	    );
	      var transaction = await signTransaction(rawTransaction);
	      var done = await send(transaction);
	      console.log(done.transactionHash);
	      //return(await done.transactionHash);

	     let sql_query = "Insert into blockchain_metadata (document_id, patient_id) values ('"+document_id+"','"+patient_id+"')"
	     let sql_query2="Delete from prescription where prescription_id=? "
	     let sql_query3="Delete from blockchain_active where prescription_id=? "
	     let query1 =db.query(sql_query,async (err,results)=>{
	     	if(err) throw err;
	     	let query2 =db.query(sql_query2,[document_id],async (err,results)=>{
	     		if(err) throw err;
	     		let query3 =db.query(sql_query3,[document_id],async (err,results)=>{
	     			if(err) throw err;
	     			res.redirect("http://localhost/flatable/default/SuccessfulPrescriptionPatient.php");
	     		});
	     	});
	     });
	     // console.log(done)

		//res.send('Done');
	});

});

app.get('/getpresc', async (req,res)=>{
	var flag=0;
	console.log("Request:");
	console.log(req.query.send);
	let sql1= "SELECT * FROM blockchain_metadata where patient_id =?";
	//let sql1= "SELECT * FROM blockchain_metadata where patient_id = '9a7a91d7-bdc5-11eb-ab33-00ff8ba50468';";
	let query =db.query(sql1,[req.query.send],async (err,results)=>{

		console.log(results);
		for (var i = 0; i< results.length;  i++) {
			console.log("Document");
			console.log(results[i].document_id);
			if(err) throw err;
			var res1 = await get_presc(results[i].document_id);
			console.log("Hello");
			//console.log(res1);
		//res.send(res1[0].DoctorEmail);
			console.log(res1);
			console.log(res1[0].prescription_id);
			let sql1= "SELECT * from active_prescription where prescription_id=?";
			let query1 = await db.query(sql1,[res1[0].document_id],async (err,results)=>{
				if(err) throw err;
				flag=1 ;
			});
			if (flag==0){
				let sql1= "INSERT INTO active_prescription (prescription_id, doctype,doctor_id, patient_id, Analysis, Medicine) VALUES(?, ?, ?, ?, ?, ?);";
				let query1 = await db.query(sql1,[res1[0].prescription_id, res1[0].doctype, res1[0].doctor_id, res1[0].patient_id, res1[0].Analysis,res1[0].Medicine],async (err,results)=>{
					if(err) throw err;
				
				});
			}
			
		}
		
		res.redirect("http://localhost/flatable/default/SuccessfulDataPatient.php");
		
	}); 
});

/*
async function Transactionn_connect(data,id){
	console.log(data);
	
	var nonce = await getTransactionCount();
		var rawTransaction = await getRawTransaction(
	        nonce,
	        data,
	        id
	    )/
	      var transaction = await signTransaction(rawTransaction);
	      var done = await send(transaction);
	      //console.log(transaction);
	      return(await done.transactionHash);
}
*/
app.listen('3000',  ()=>{
	console.log('Server started on port 3000');
});