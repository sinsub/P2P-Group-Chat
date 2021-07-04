// DOM Elements
const joinBtn = document.getElementById("joinBtn");
const peerIdTextBox = document.getElementById("peerIdTextBox");
const sendMssgBtn = document.getElementById("sendMssgBtn");
const mssgTextBox = document.getElementById("mssgTextBox");
const mssgList = document.getElementById("mssgList");

// disabled till the peer is set up
joinBtn.disabled = true;

// disabled till a connection is established
sendMssgBtn.disabled = true;

// Global variables:
const peer = new Peer();    // my peer
let connections = [];       // array of connections


// peer set up successfully   
peer.on('open', function (id) {
    // enable join
    joinBtn.disabled = false;

    var mssgElement = document.createElement("li");
    mssgElement.className = "list-group-item list-group-item-primary text-center";
    mssgElement.innerText = `Your peer ID:  ${peer.id}`;
    mssgList.append(mssgElement);
});


// received a connection 
peer.on('connection', function (conn) {
    connections.push(conn);

    var mssgElement = document.createElement("li");
    mssgElement.className = "list-group-item list-group-item-primary text-center";
    mssgElement.innerText = `Received Data Connection by | ${conn.peer}`;
    mssgList.append(mssgElement);

    conn.on('open', function () {
        // !!!!!!!Add code to handle if connection request from already existing connection
        // DataConnection ready to use
        sendMssgBtn.disabled = false;

        var mssgElement = document.createElement("li");
        mssgElement.className = "list-group-item list-group-item-primary text-center";
        mssgElement.innerText = `Received Data Connection ready | ${conn.peer}`;
        mssgList.append(mssgElement);

        // Event Listener for received data
        conn.on('data', function (data) {
            if (data.type == "message") {
                var mssgElement = document.createElement("li");
                mssgElement.className = "list-group-item";
                mssgElement.innerText = "[ " + conn.peer.substring(0, 5) + " ]  |  " + data.message;
                mssgList.append(mssgElement);
            }
            // else if (data.type == ...)...

        });

        conn.on('close', function () {
            var mssgElement = document.createElement("li");
            mssgElement.className = "list-group-item list-group-item-primary text-center";
            mssgElement.innerText = `Data Connection closed | ${conn.peer}`;
            mssgList.append(mssgElement);
        });
    });
});


joinBtn.onclick = () => {
    var conn = peer.connect(peerIdTextBox.value);
    conn.on('open', function () {
        sendMssgBtn.disabled = false;
        connections.push(conn);

        var mssgElement = document.createElement("li");
        mssgElement.className = "list-group-item list-group-item-primary text-center";
        mssgElement.innerText = `Connected to | ${conn.peer}`;
        mssgList.append(mssgElement);

        // Receive messages
        conn.on('data', function (data) {
            if (data.type == "message") {
                var mssgElement = document.createElement("li");
                mssgElement.className = "list-group-item";
                mssgElement.innerText = "[ " + conn.peer.substring(0, 5) + " ]  |  " + data.message;
                mssgList.append(mssgElement);
            }
        });
    });

    conn.on('close', function () {
        // remove from connections:
        const index = connections.indexOf(conn);
        if (index > -1) {
            connections.splice(index, 1);
        }
    });
};


sendMssgBtn.onclick = () => {
    const mssg = {
        type: "message",
        message: mssgTextBox.value
    };
    mssgTextBox.value = "";

    var mssgElement = document.createElement("li");
    mssgElement.className = "list-group-item text-end";
    mssgElement.innerText = mssg.message + "  |  [ You] ";
    mssgList.append(mssgElement);

    connections.forEach((conn) => {
        if (conn.open) {
            conn.send(mssg);
        }
    });
};


peer.on('error', function (err) {
    if (err.type == 'peer-unavailable') {
        var mssgElement = document.createElement("li");
        mssgElement.className = "list-group-item list-group-item-primary text-center";
        mssgElement.innerText = `Coudnt not connet to a peer`;
        mssgList.append(mssgElement);
    }
});