const dgram = require('dgram');
const protobuf = require("protobufjs");
const request = require('request');

// ==============================
// variables
// ==============================

const autoStart = false;
const antsServer = '10.51.128.52'; // localhost
const uiServer = 'localhost'; // localhost

var TelemetryMessage;
var totalAnts = 2;
var totalMoves = 6;

let counter1 = -1;
let payloads1 = [];
let commands1 = [];

let counter2 = -1;
let payloads2 = [];
let commands2 = [];

let counter3 = -1;
let payloads3 = [];
let commands3 = [];

// ==============================
// "main" method
// ==============================

startupServer();

// ==============================
// functions
// ==============================

function startupServer(){
    initProtoBuf();
    initPayloads();
    const client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    client.on('listening', function () {
        const address = client.address();
        console.log('UDP Client listening on ' + address.address + ":" + address.port);
        client.setBroadcast(true)
        client.setMulticastTTL(128); 
        client.addMembership('230.185.192.108');
    });

    client.on('message', function (message, remote) {   
        console.log('Msg: From: ' + remote.address + ':' + remote.port +' - ' + message);
        if((message + '').startsWith('UI:START')){
            reportCompletedToUi(1); // position the first ant on the grid
            sendCommandsToRealAnts(); // auto pass the data to the real ants server
        }
        if((message + '').startsWith('ANTS:FINISH_')){
            reportCompletedToUi(message.replace('ANTS:FINISH_', ''));
        }
    });
 
    client.bind(1337);
};

function sendCommandsToRealAnts(){
    for(let i = 0; i < totalMoves; i++){
        setTimeout(_ => {
            if(totalAnts >= 1) sendToRealAntServer(1, commands1[i]);
            if(totalAnts >= 2) sendToRealAntServer(2, commands2[i]);
            if(totalAnts >= 3) sendToRealAntServer(3, commands3[i]);
        }, i * 100);
    }
};

function sendToRealAntServer(ant, command){
    if(command !== 'NULL'){
        request({
        method: 'PUT',
        url: 'http://' + antsServer + ':3000/api/ants/' + ant,
        body: { "antCommandsArr": [command] },
        json: true,
        headers: {
            'User-Agent': 'request'
        }
        }, (err, res, body) => {
            console.log(err);
        });
   }
}

function initProtoBuf(){
    protobuf.load("./telemetryMessage.proto", function(err, root) {
      if (err){
          console.log(err);
          throw err;
      }
  
      TelemetryMessage = root.lookupType("telemetrypackage.TelemetryMessage");
      if(autoStart){
        reportCompletedToUi(1); // position the first ant on the grid
        sendCommandsToRealAnts(); // auto pass the data to the real ants server
      }
    });
  };

function reportCompletedToUi(ant){
    if(ant === 1){
        counter1++;
        console.log('ant ' + ant + ':' + payloads1[counter1] + ', ' + payloads1[counter1].id);
        sendTelemetry(payloads1[counter1]);
    }
    if(ant === 2){
        counter2++;
        console.log('ant ' + ant + ':' + payloads2[counter2]);
        sendTelemetry(payloads2[counter2]);
    }
    if(ant === 3){
        counter3++;
        console.log('ant ' + ant + ':' + payloads3[counter3]);
        sendTelemetry(payloads3[counter3]);
    }
}

function sendTelemetry(payload){
	const errMsg = TelemetryMessage.verify(payload);
	if (errMsg){
		console.log('Error:' + errMsg);
		return;
	}
	else{
        if(payload.id === -1) return;
		const message = TelemetryMessage.create(payload);
		const buffer = TelemetryMessage.encode(message).finish();

	    const client = dgram.createSocket('udp4');
	    client.send(buffer, 41848, uiServer, (err) => {
		   if (err != null) console.log('Err: ' + err);
		   client.close();
	    });
	}
}

// ==============================
// Init the simulation parameters
// ==============================

function initPayloads(){
    // 1 (starts on map and moves to first T junction, then becomes trans)
    payloads1.push({id: 1, x: 2, y: 30, angle: 0, ll:'wall', ul:'open', rl:'open', bl:'entry', battery:100, type:'scout'});  //1
    payloads1.push({id: 1, x: 2, y: 29, angle: 0, ll:'wall', ul:'open', rl:'open', bl:'open', battery:99, type:'scout'});  //2
    payloads1.push({id: 1, x: 2, y: 28, angle: 0, ll:'wall', ul:'open', rl:'open', bl:'open', battery:98, type:'scout'});  //3
    payloads1.push({id: 1, x: 2, y: 27, angle: 0, ll:'wall', ul:'open', rl:'open', bl:'open', battery:97, type:'scout'});  //4
    payloads1.push({id: 1, x: 2, y: 27, angle: 90, ll:'wall', ul:'open', rl:'open', bl:'open', battery:96, type:'scout'});  //5
    payloads1.push({id: 1, x: 2, y: 27, angle: 90, ll:'wall', ul:'open', rl:'open', bl:'open', battery:95, type:'trans'}); //6
    payloads1.push({id: -1, x: 2, y: 27, angle: 90, ll:'wall', ul:'open', rl:'open', bl:'open', battery:94, type:'trans'}); //7

    commands1.push('f1');
    commands1.push('f1');
    commands1.push('f1');
    commands1.push('r1');
    commands1.push('NULL');
    commands1.push('NULL');
    commands1.push('NULL');

    // 2 (starts outside, moves past ant 1)
    payloads2.push({id: 2, x: 3, y: 30, angle: 0, ll:'open', ul:'open', rl:'open', bl:'entry', battery:100, type:'scout'});  //1
    payloads2.push({id: 2, x: 3, y: 29, angle: 0, ll:'open', ul:'open', rl:'open', bl:'open', battery:99, type:'scout'});  //2
    payloads2.push({id: 2, x: 3, y: 28, angle: 0, ll:'open', ul:'open', rl:'open', bl:'open', battery:98, type:'scout'});  //3
    payloads2.push({id: 2, x: 3, y: 27, angle: 0, ll:'open', ul:'open', rl:'open', bl:'open', battery:97, type:'scout'});  //4
    payloads2.push({id: 2, x: 3, y: 26, angle: 0, ll:'open', ul:'wall', rl:'open', bl:'open', battery:96, type:'scout'});  //5
    payloads2.push({id: 2, x: 3, y: 26, angle: 90, ll:'open', ul:'wall', rl:'open', bl:'open', battery:95, type:'scout'}); //6
    payloads2.push({id: 2, x: 4, y: 26, angle: 90, ll:'open', ul:'wall', rl:'open', bl:'open', battery:94, type:'scout'}); //7

    commands2.push('f1');
    commands2.push('f1');
    commands2.push('f1');
    commands2.push('f1');
    commands2.push('f1');
    commands2.push('r1');
    commands2.push('f1');
    
    // total moves
    totalMoves = payloads1.length;
};