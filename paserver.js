/*==========================================================================
 PROGRAM 		: Power analyser server application
 DESCRIPTION    : This module listens to the controllers and updates the database







 AUTHOR			: Krishan Indaka
*/


var fs = require('fs');
const mqtt = require('mqtt')  
 

// Get the configuration ---------------------------------------------------
var dataconf = fs.readFileSync('config/serverconfig.conf'),
    myFileObj;

myFileObj = JSON.parse(dataconf);
  try {
    myFileObj = JSON.parse(dataconf);

  }
  catch (err) {
    console.log('There has been an error parsing device.onf')
    console.log(err);
  }
  
  // setup MQTT connetion parameters
  var options = {
  port: myFileObj.port,
  host: 'mqtt://'+myFileObj.serverip,
  username: myFileObj.mqttuser,
  password: myFileObj.mqttpassword
};
 

/*

SECTION		: MySQL initial setup 



*/

var mysql = require("mysql");


var DivValues='';


var myQueryString='';


var logrecord ={ company: '', location: '', logdatestring: '', scantype: '', readingvalue: 0};
var logRecords=[];

// Connection string to the database
var con = mysql.createConnection({
  host: "localhost",
  user: myFileObj.databaseuser,
  password: myFileObj.databasepassword,
  database: myFileObj.dbname,
  timezone: "utc",
  multipleStatements: true
});


con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established to DB');
});

//----------------------------- MySQL ---- Initiation ends here -----------

  
  
// Connect to the MQTT server
const client = mqtt.connect('mqtt://'+myFileObj.serverip+':'+myFileObj.port,{ username: myFileObj.mqttuser, password: myFileObj.mqttpassword})
//const client = mqtt.connect(options)
var myMsgObj;

console.dir('Connected to main HUB Server :'+ myFileObj.serverip)
console.log(client)

var datacontroller =fs.readFileSync('config/controllerlist.conf')



myControllerList = JSON.parse(datacontroller);
console.log('Controllers Installed', myControllerList)

/*
newObject = myMsgObj.filter(function (el){
	return el.NodeID=='NODOP001'
	
});
*/

  try {
    myControllerList = JSON.parse(datacontroller);

  }
  catch (err) {
    console.log('There has been an error parsing controller.list.conf')
    console.log(err);
  }
 

client.on('connect', () => { 
var i;
console.log('Connection is sucessful ..');
 for(i=0; i< myControllerList.length; i++ )
 {
 client.subscribe( myControllerList[i].controllerid)
 console.log("Connected to controller :",myControllerList[i].controllerid)

}
/*/ anything on connection



*/
})

function getObjectInArray(arr, key) {    
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].DeviceID == key) 
			return arr[i].PinNumber;
    }
}


client.on('message', (topic, message) => {  

console.log('topic',topic);
var newObject=JSON.parse(message);

console.log('new object',newObject)

console.log('updating records',newObject);
bulkInsert( 'loghistory', newObject, (error, response) => {
  if (error) console.log(error)
	else
  console.log('response',response);
});
	
})


function bulkInsert(table, objectArray, callback) {
  console.log('Object passed',objectArray);
  let keys = Object.keys(objectArray[0]);
  let values = objectArray.map( obj => keys.map( key => obj[key]));
  let sql = 'INSERT INTO ' + table + ' (' + keys.join(',') + ') VALUES ?';
  con.query(sql, [values], function (error, results, fields) {
    if (error) callback(error);
    callback(null, results);
  });
} 
  
