var http = require('http');
var fs = require('fs');
var formidable = require("formidable");
var util = require('util');
var mysql = require("mysql");

// var locationFilter=''; // moved to front end

var lastReadTemporature=0;
var lastReadHumidiry=0;
var lastReadDewFactor=0;
var lastReadVoltage=0;
var returnDBData=true;
var initialisedDBParam = false;

var myQueryString='';

var alertrecord ={ alertdate: '', alerttime: '', description:'', alertstatus:'',company: '', location: '', scantype: '', readingvalue: 0, primarycontact: '', primaryemail: ''};


// Connection string to the database
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "poweranalyzer"
});




con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
	console.log(err);
    return;
  }
  console.log('Connection established');
});


 var query=con.query('select * from monitoringpoints limit 1', function(err,rows){
	if(err) throw err;
	else
	{
		locationFilter=rows[0].location

	}
});

var server = http.createServer(function (req, res) {

//	console.log('Request recieved');
	//console.log(req.headers);
//	x=req.headers['access-control-request-method'];
//	console.log(x);

    if ( req.method.toLowerCase()  == 'get') {
		//displayJSON(req, res);
		processValueRequest(req, res);
		console.log('Get Request recieved');
       // displayForm(res);
    } else if (req.method.toLowerCase()  == 'post') {
        //processAllFieldsOfTheForm(req, res);
        console.log('Post Request recieved');
		processValueRequest(req, res);
		//processFormFieldsIndividual(req, res);


    }

});



function processAllFieldsOfTheForm(req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        //Store the data from the fields in your data store.
        //The data store could be a file or database or any other store based
        //on your application.
        res.writeHead(200, {
            'content-type': 'text/plain'
        });
        res.write('received the data:\n\n');
        res.end(util.inspect({
            fields: fields,
            files: files
        }));
    });
}

function processFormFieldsIndividual(req, res) {
    //Store the data from the fields in your data store.
    //The data store could be a file or database or any other store based
    //on your application.
    var fields = [];
    var form = new formidable.IncomingForm();
    form.on('field', function (field, value) {

        fields[field] = value;
    });

    form.on('end', function () {
        res.writeHead(200, {
            'content-type': 'text/plain'
        });
        res.write('received the data:\n\n');
        res.end(util.inspect({
            fields: fields
        }));
    });
    form.parse(req);
}

function processValueRequest(req, res) {
    var fields = [];
    var form = new formidable.IncomingForm();
	var outputRecords='';
	var queryString='';
	var myValuesObj;
	//console.log(form);

	function oneweekData(){

	}
	function oneYearData(){

	}

    form.on('field', function (field, value) {

		myValuesObj = JSON.parse(value);
	 //   console.log(myValuesObj);
        fields[field] = value;
		returnDBData=true;
	// building the sql ------
	if (myValuesObj.calltype == 'Real Time')
	{


	  myQueryString='SELECT controlid, scantype, readingvalue, LogDateString, location, upperthreshold,lowerthreshold, idealvalue, controlid,primarycontact,primaryemail,secondarycontact,secondaryemail,cameraurl FROM (select * from loghistory where location=\''+myValuesObj.filter+'\' order by logdatestring desc limit 12 ) A JOIN (select * from scantypes where controlid is not null )B ON A.scantype = scantypeid'
	//myQueryString='SELECT * from (select scantype,readingvalue , MAX(LogDateString) AS LDATE FROM loghistory where location=\''+myValuesObj.filter+'\' GROUP BY scantype)  t1  join (select * from scantypes where controlid is not null) t2 on t1.scantype=t2.scantypeid';

	// myQueryString ='select controlid, scantype, readingvalue,LDATE as LogDateString, location, upperthreshold,lowerthreshold, idealvalue, controlid,primarycontact,primaryemail,secondarycontact,secondaryemail,cameraurl from (SELECT  scantype,readingvalue , MAX(LogDateString) AS LDATE, location FROM loghistory where location=\''+myValuesObj.filter+'\' GROUP BY scantype) A, (select * from scantypes where controlid is not null) B where A.scantype=B.scantypeid'
	// myQueryString ='SELECT controlid, B.scantype, readingvalue, LogDateString, location, upperthreshold,lowerthreshold, idealvalue, controlid,primarycontact,primaryemail,secondarycontact,secondaryemail,cameraurl FROM scantypes A, (SELECT scantype, readingvalue, LogDateString , location FROM loghistory where location= \''+myValuesObj.filter+'\' and logdatestring IN (SELECT MAX(logdatestring) FROM loghistory where location= \''+myValuesObj.filter+'\') group by scantype) B WHERE B.SCANTYPE=A.SCANTYPEID and controlid is not null ORDER BY controlid DESC';

	 //myQueryString='SELECT controlid, B.scantype, readingvalue, LogDateString, location, upperthreshold,lowerthreshold, idealvalue, controlid,primarycontact,primaryemail,secondarycontact,secondaryemail,cameraurl FROM scantypes A, (SELECT scantype, readingvalue, LogDateString , location FROM loghistory where location= \''+myValuesObj.filter+'\' group by ScanType DESC) B WHERE B.SCANTYPE=A.SCANTYPEID and controlid is not null ORDER BY controlid DESC';
	    /*  on 20-03-2017
		res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200, {
            'content-type': 'x-application/json'
        })

		// Get the values from the last read data
        res.end(JSON.stringify([{temperature: lastReadTemporature, humidity: lastReadHumidiry, dewFactor: lastReadDewFactor, voltage: lastReadVoltage }]));
		form.parse(req);
		returnDBData=false;
		console.log(JSON.stringify([{temperature: lastReadTemporature, humidity: lastReadHumidiry, dewFactor: lastReadDewFactor, voltage: lastReadVoltage }])); */
	}
		else
/*	if (myValuesObj.calltype == 'Change-Location')
	{
	    console.log('----------------------change location',myValuesObj.filter);
		locationFilter = myValuesObj.filter;
		console.log('----------------------------------------------------------',locationFilter)

	}
	else */
	if (myValuesObj.calltype == 'Users')
	{
		myQueryString='SELECT username, password from user';


	} else
	if (myValuesObj.calltype == 'Online')
	{
		myQueryString='SELECT `company`,`location`,`logdate`,`logtime`,`description`,`readingvalue` FROM `loghistory` '+myValuesObj.filter+ ' ORDER BY id DESC';


	}
	else if(myValuesObj.calltype == 'Line-Graph')

	{
		     //myQueryString='SELECT FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(logdatestring))/300)*300) AS timeslot, company, location, max(readingvalue) as maxreading, description from loghistory GROUP BY timeslot, Description ORDER BY timeslot desc limit 48'
			 myQueryString='SELECT logdatestring AS timeslot, company, location, readingvalue , description from loghistory ORDER BY timeslot desc limit 60'

	}
	else if(myValuesObj.calltype == 'Graph')

	{
			  myQueryString='SELECT `logtime`,`readingvalue` FROM `loghistory` '+myValuesObj.filter+ ' ORDER BY id';
			  myQueryString=myValuesObj.filter;

	}
	else if(myValuesObj.calltype == 'Six-Graphs')

	{
			  myQueryString=myValuesObj.filter;
			  console.log('-----------------------------------',myValuesObj.filter);

	}
	else if(myValuesObj.calltype == 'User-Login')
	{
			  myQueryString='SELECT a.username, userrole FROM users a WHERE ' + myValuesObj.filter;
	}
	else if(myValuesObj.calltype == 'User-Locations')
	{
			  myQueryString='SELECT locationid, location FROM monitoringpoints x, (SELECT locationname FROM users a, userlocation b WHERE a.username = b.username AND a.username = \'' + myValuesObj.filter + '\') y WHERE x.location = y.locationname';
	}
	else if(myValuesObj.calltype == 'Admin-Locations')
	{
			  myQueryString='select locationid, location from monitoringpoints';
	}
	else
	if (myValuesObj.calltype == 'Critical')
	{

		myQueryString='SELECT company, location, scantype, logdatestring, ReadingValue FROM `loghistory` where  logdatestring >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';

	}
	else
		if (myValuesObj.calltype == 'Live-Feed')


	{

    myQueryString='SELECT company, location, logdatestring, logtime, description, scantype,readingvalue FROM `loghistory` ORDER BY id DESC LIMIT 40';


	}

	// for the new status display
		else
		if (myValuesObj.calltype == 'Scantypes-List-Status')
		{

		myQueryString='SELECT * FROM scantypes where scanmethod=1';

	}
		else
		if (myValuesObj.calltype == 'Scantypes-List-Alert')
		{

		myQueryString='SELECT * FROM scantypes where scanmethod=0';

	}

		else
		if (myValuesObj.calltype == 'Locations')
		{

		myQueryString='SELECT locationid,location FROM monitoringpoints where scan_enabled=1 order by location';

	}



	else
		if (myValuesObj.calltype == 'Camera-List')
		{

		myQueryString='SELECT * FROM cameras';

	}
		else
		if (myValuesObj.calltype == 'Ideal-Values')
		{

		myQueryString='SELECT * FROM thresholds';

	}
	else
		if (myValuesObj.calltype == 'Scan-Types')
		{

		myQueryString='select * from scantypes ORDER BY controlid DESC '

	}
		else
		if (myValuesObj.calltype == 'Gauges-CP')
		{

		myQueryString='select * from scantypes ORDER BY controlid DESC'

	}
	else
		if (myValuesObj.calltype == 'Scan-Types-CP')
		{

		myQueryString='select scantypeid,description,controlid,divvalue,idealvalue,lowerthreshold,upperthreshold,primarycontact, primaryemail,secondarycontact,secondaryemail from scantypes ORDER BY controlid DESC'

	}
	else
		if (myValuesObj.calltype == 'Monitoring-Points-CP')
		{

		myQueryString='select locationid,company,location,address01,address02,address03,primary_name,primary_mobile,iporurl,scan_enabled from monitoringpoints'

	}
	else
		if (myValuesObj.calltype == 'History-Log-CP')
		{

		myQueryString='select * from loghistory ORDER BY id DESC limit 10000'

	}
	else
		if (myValuesObj.calltype == 'Alerts-Log-CP')
		{

		myQueryString='select * from criticalalerts where location=\''+myValuesObj.filter+'\' order by alertdate desc'

	}
	else
		if (myValuesObj.calltype == 'Load-Thresholds')
		{

		//myQueryString='SELECT * FROM `scantypes` WHERE CONVERT(controlid, UNSIGNED) >0'
		myQueryString='SELECT * FROM scantypes ORDER BY controlid DESC'

	}
	else
		if (myValuesObj.calltype == 'Matrix-Data')
		{
		myQueryString= 'select scantype, DATE_FORMAT(logdatestring, \'%W\') as logdate ,avg(readingvalue) as avgvalue from loghistory '
		myQueryString=myQueryString+'where logdatestring > DATE_SUB(now(), INTERVAL 7 DAY) '
		myQueryString=myQueryString+'group by day(logdatestring), scantype'
		console.log(myQueryString)
	}


	else
		if (myValuesObj.calltype == 'Camera-List-CP')
		{

		myQueryString='select * from cameras'

	}
		else
		if (myValuesObj.calltype == 'Prediction-01')
		{
		myQueryString='SELECT * FROM loghistory WHERE '+myValuesObj.filter
		console.log(myValuesObj);
	}
		else
		if (myValuesObj.calltype == 'Prediction-02')
		{
		myQueryString=myValuesObj.filter
		console.log(myValuesObj);
	}
	   else
		if (myValuesObj.calltype == 'History-Data')
		{

		myQueryString= `SELECT id,location, unix_timestamp(logdatestring)*1000 as timestamp, Scantype, readingvalue,updatedstatus FROM loghistory WHERE location = '${myValuesObj.filter}'`
		console.log(myQueryString);
	}

		else
		if (myValuesObj.calltype == 'Heart-Beat-DB')
		{

		myQueryString='SELECT  scantype,readingvalue , MAX(LogDateString) AS LDATE FROM loghistory where location=\''+myValuesObj.filter +'\' GROUP BY scantype'

		//myQueryString='SELECT  scantype,readingvalue , MAX(LogDateString) AS LDATE FROM loghistory WHERE location=\''+myValuesObj.filter +'\' and logdatestring IN (SELECT MAX(logdatestring) FROM loghistory where location=\''+myValuesObj.filter +'\') group by scantype'
		console.log(myQueryString);
	}
	else
		if (myValuesObj.calltype == 'History-Graph')
		{

	    //myValuesObj.filter = 'scantype=\'Current Average\' and logdatestring > DATE_SUB(now(), INTERVAL 6 DAY) group by day(logdatestring) order by LogDateString desc'
		myQueryString='SELECT * from loghistory' +myValuesObj.filter
		console.log(myQueryString);

		}
		else
		if (myValuesObj.calltype == 'Alert-Record')
		{
			myQueryString='Something';
			/*var query=con.query('INSERT INTO criticalalerts SET ?', myValuesObj.filter, function(err,res){
			if(err) throw err;
			else
		    console.log('Alert Recorded:')
		    });
			*/

	}else
		if (myValuesObj.calltype == 'Gauges-Update')
		{
			console.log(myValuesObj.filter);
			myQueryString='update scantypes set ';
			myQueryString+= 'ActiveStatus = ' + myValuesObj.filter.ActiveStatus + ' , ';
			myQueryString+= 'Description = \''+ myValuesObj.filter.Description + '\' , ';
			myQueryString+= 'idealvalue = '+ myValuesObj.filter.idealvalue + ' , ';
			myQueryString+= 'startvalue = '+ myValuesObj.filter.startvalue + ' , ';
			myQueryString+= 'endvalue =  '+ myValuesObj.filter.endvalue + ' , ';
			myQueryString+= 'ticinterval = '+ myValuesObj.filter.ticinterval + ' , ';
			myQueryString+= 'controlid = \''+ myValuesObj.filter.controlid + '\' , ';
			myQueryString+= 'scantypeid = \''+ myValuesObj.filter.scantypeid + '\' ' ;
			//scantype=\''+_scanType +'\' and logdatestring
			myQueryString+= ' where scantypeid = \''+ myValuesObj.filter.scantypeid +'\'';
			console.log(myQueryString);

	}

	else
		if (myValuesObj.calltype == 'ScanTypes-Update')
		{
			console.log(myValuesObj.filter);
			myQueryString='update scantypes set ';
			myQueryString+= 'idealvalue = '+ myValuesObj.filter.idealvalue + ' , ';
			myQueryString+= 'controlid = \''+ myValuesObj.filter.controlid + '\' , ';
			myQueryString+= 'divvalue = \''+ myValuesObj.filter.divvalue + '\' , ';
			myQueryString+= 'lowerthreshold = \''+ myValuesObj.filter.lowerthreshold + '\' , ';
			myQueryString+= 'upperthreshold = \''+ myValuesObj.filter.upperthreshold + '\' , ';
			myQueryString+= 'primarycontact = \''+ myValuesObj.filter.primarycontact + '\' , ';
			myQueryString+= 'primaryemail = \''+ myValuesObj.filter.primaryemail + '\' , ';
			myQueryString+= 'secondarycontact = \''+ myValuesObj.filter.secondarycontact + '\' , ';
			myQueryString+= 'secondaryemail = \''+ myValuesObj.filter.secondaryemail + '\' , ';


			myQueryString+= 'scantypeid = \''+ myValuesObj.filter.scantypeid + '\' ' ;
			//scantype=\''+_scanType +'\' and logdatestring
			myQueryString+= ' where scantypeid = \''+ myValuesObj.filter.scantypeid +'\'';
			console.log(myQueryString);

	}

	else if (myValuesObj.calltype === 'Today-Stats'){
			myQueryString = `SELECT MIN(readingvalue) as minVoltage, MAX(readingvalue) as maxVoltage FROM loghistory WHERE DATE(logdatestring) = CURDATE() AND location = '${myValuesObj.filter}'`;
			console.log(myQueryString);
		}

	else if (myValuesObj.calltype === 'Today-Consumption'){
		myQueryString = `select SUM(energy) as todayEnergy, MAX(power) todayPeakKW from realtimedata WHERE MONTH(read_time) = MONTH(CURRENT_DATE()) AND YEAR(read_time) = YEAR(CURRENT_DATE()) AND location = '${myValuesObj.filter}'`;
		console.log(myQueryString);
	}



	// ---------------------- end of routing -------------
    });




    form.on('end', function () {
/*
	if (initialisedDBParam)
		console.log('DB parameters set')
	else{

			    var query=con.query('set global sql_mode= \''STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'+ '\'', function(err,rows){

					if(err) throw err;
					else
					{

						 initialisedDBParam= true;

					}
					});
			    var query=con.query('set session sql_mode= \''STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'+'\'', function(err,rows){

					if(err) throw err;
					else
					{

						 initialisedDBParam= true;

					}
					});


	} */

	if (returnDBData)

	{

	    console.log('My query String ',myQueryString);

		if ( myQueryString == '') {
            console.log('query is empty');
            outputRecords = 'API is up and running';
        }
		else
		if (myValuesObj.calltype == 'Alert-Record')
		{
			myQueryString='';
			var query=con.query('INSERT INTO criticalalerts SET ?', myValuesObj.filter, function(err,res){
			if(err) throw err;
			else
		    console.log('Alert Recorded in database',myValuesObj)
		    sendEmail(myValuesObj);
		    });


		}
	    else {
	    var query=con.query(myQueryString, function(err,rows){
			//console.log('MySQL error',err);
					if(err) throw err;
					else
					{

						 outputRecords=JSON.stringify(rows);

					}
					});
		}

		setTimeout(function () {

		res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200, {
			'content-type': 'application/json'
            //'content-type': 'x-application/json'
        });

        res.end(outputRecords);
		console.log(myQueryString);
		console.log('Responded to Request');
		//console.log(outputRecords);
		},3000);
	}
    });
    form.parse(req);
}

function displayJSON(req, res) {


    var fields = [];
    var form = new formidable.IncomingForm();
    form.on('field', function (field, value) {
      //  console.log(field);
     //   console.log(value);
        fields[field] = value;
    });

    form.on('end', function () {
        res.writeHead(200, {'content-type': 'text/plain'});
	    res.write('Data recieved');

		/*/-------------------------------------------
		var query=con.query('SELECT INTO loghistory SET ?', logrecord, function(err,res){
			console.log(err);
					if(err) throw err;
					else
					{
						console.log(query.sql);
						console.log('Last insert ID:', res.insertId)

					}
					});





		//-----------------------------------------------
		*/

		//console.log(mlogrecords);
        res.end('test',{ name: 'name is this', address: 'address is this'});
		console.log('responded');
		//console.log(fields);
    });
    form.parse(req);
}



function sendEmail(emObj){
	/*
 myqueryString=
 var query=con.query(myQueryString, function(err,rows){
			//console.log('MySQL error',err);
					if(err) throw err;
					else
					{

						 outputRecords=JSON.stringify(rows);

					}
					}); */


/*
var email = require("../email/emailjs/email"); var fs = require('fs'),
    request = require('../email/node_modules/request')

// sending the email
setTimeout( function (){

var server  = email.server.connect({
   host:    "localhost.localdomain",
   port:    "25",
   ssl:     false
});

var message	= {
   text:    "iSmart alerts - Image from asigned camara is attached",
   from:    "<vajira@optimatec.lk>",
   to:      "<"+ emObj.filter.primaryemail+">",
   cc:      "<"+ emObj.filter.secondaryemail+">",
   subject: "Alert at :"+ emObj.filter.alertdate+":"+emObj.filter.company+"-"+emObj.filter.location

};

// send the message and get a callback with an error or details of the message that was sent
server.send(message, function(err, message) { console.log(err || message); });
console.log('to',"<"+ emObj.filter.primaryemail+">")
console.log('CC',"<"+ emObj.filter.secondaryemail+">")

},20000);

*/
}

server.listen(6060,"localhost");
console.log("server listening on 6060");
