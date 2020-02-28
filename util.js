/*==========================================================================



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
 

  
// Connect to the MQTT server
const client = mqtt.connect('mqtt://'+myFileObj.serverip+':'+myFileObj.port,{ username: myFileObj.mqttuser, password: myFileObj.mqttpassword})
//const client = mqtt.connect(options)
var myMsgObj;

console.dir('Connected to main HUB Server :'+ myFileObj.serverip)

client.on('connect', () => { 
var i;
console.log('Connection is sucessful ..');
 client.subscribe('PUBLICIP')
 console.log("Connected to Public IP :")


})


client.on('message', (topic, message) => {  

console.log(JSON.parse(message));

});




  
  
