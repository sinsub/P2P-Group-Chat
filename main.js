// DOM Elements
const joinBtn = document.getElementById("joinBtn");
const peerIdTextBox = document.getElementById("peerIdTextBox");
const sendMssgBtn = document.getElementById("sendMssgBtn");
const mssgTextBox = document.getElementById("mssgTextBox");
const mssgList = document.getElementById("mssgList");
const userNameTextBox = document.getElementById("userNameTextBox");
const setUserNameBtn = document.getElementById("setUserNameBtn");
const disconnectBtn = document.getElementById("disconnectBtn");


// disabled till the peer is set up
joinBtn.disabled = true;

// disabled till a connection is established
sendMssgBtn.disabled = true;
disconnectBtn.disabled = true;

// Global variables:
const peer = new Peer();    // my peer
let connections = [];       // array of connections
const connectionUserName = new Map();
let userName;


// --- PEER EVENT LISTENERS ---

// peer set up successfully   
peer.on('open', function (id) {
    // enable join
    joinBtn.disabled = false;

    let mssgElement = document.createElement("button");
    mssgElement.className = "list-group-item list-group-item-primary text-center";
    mssgElement.innerText = `Your peer ID:  ${peer.id}`;
    mssgList.append(mssgElement);

    mssgElement.onclick = () => {
        copyToClipboard(peer.id);
    };

    // set default user name
    userNameTextBox.value = userName = peer.id.substring(0, 5);
});


// received a connection 
peer.on('connection', function (conn) {

    conn.on('open', function () {
        onOpenConnection(conn);

        // send the peer id of all connections
        // so that the new peer can connect to
        // all peers this peer is connected to
        // forming a complete graph
        connections.forEach((connection) => {
            if (connection.peer != conn.peer) {
                conn.send({
                    type: "peer",
                    message: connection.peer
                });
            }
        });
    });

    // Event Listener for received data
    conn.on('data', function (data) { onReceiveData(conn, data) });

    conn.on('close', function () { onCloseConnection(conn); });
});


peer.on('error', function (err) {
    if (err.type == 'peer-unavailable') {
        let mssgElement = document.createElement("li");
        mssgElement.className = "list-group-item list-group-item-primary text-center";
        mssgElement.innerText = `Coudnt not connect to a peer`;
        mssgList.append(mssgElement);
    }
});





// --- ACTIONS ---

// Try to connect to remote peer
function connect(peerId) {
    // if connection already exists ignore
    for (let i = 0; i < connections.length; i++) {
        if (connections[i].peer == peerId)
            return;
    }

    let conn = peer.connect(peerId);

    conn.on('open', function () {
        onOpenConnection(conn);
    });

    // Receive messages
    conn.on('data', function (data) { onReceiveData(conn, data) });
    conn.on('close', function () { onCloseConnection(conn); });
}


function disconnectAll() {
    while (connections.length > 0) {
        connections[0].close();
    }
}


function onOpenConnection(connection) {
    // if connection already exists close this new connection
    for (let i = 0; i < connections.length; i++) {
        if (connections[i].peer == connection.peer) {
            connection.close();
            return;
        }
    }

    sendMssgBtn.disabled = false;
    disconnectBtn.disabled = false;

    connections.push(connection);

    // send current user name
    connection.send({
        type: "username",
        message: userName
    });

    let mssgElement = document.createElement("li");
    mssgElement.className = "list-group-item list-group-item-primary text-center";
    mssgElement.innerText = `Connected to | ${connection.peer}`;
    mssgList.append(mssgElement);

    console.log(connections);
    console.log(connectionUserName);
}


function onCloseConnection(connection) {
    console.log("Closed connection")

    let mssgElement = document.createElement("li");
    mssgElement.className = "list-group-item list-group-item-primary text-center";
    mssgElement.innerText = `Data Connection closed | ${connection.peer}`;
    mssgList.append(mssgElement);

    // remove from connections:
    removeFromArray(connections, connection);
    // remoce from username map:
    connectionUserName.delete(connection);

    if (connections.length == 0) {
        sendMssgBtn.disabled = true;
        disconnectBtn.disabled = true;
    }

    console.log(connections);
    console.log(connectionUserName);
}


function onReceiveData(connection, data) {
    if (data.type == "message") {
        let mssgElement = document.createElement("li");
        mssgElement.className = "list-group-item";
        mssgElement.innerText = "[ " + connectionUserName.get(connection) + " ]  |  " + data.message;
        mssgList.append(mssgElement);
    }
    else if (data.type == "username") {
        connectionUserName.set(connection, data.message);
        console.log(connections);
        console.log(connectionUserName);
    } else if (data.type == "peer") {
        connect(data.message);
    }
}




// --- BUTTON ONCLICK FUNCTIONS ---

joinBtn.onclick = () => {
    // join a new lobby
    // diconnect from the current lobby
    disconnectAll();
    connect(peerIdTextBox.value);
    peerIdTextBox.value = "";
};


sendMssgBtn.onclick = () => {
    if (!mssgTextBox.value) return;
    const mssg = {
        type: "message",
        message: mssgTextBox.value
    };
    mssgTextBox.value = "";

    let mssgElement = document.createElement("li");
    mssgElement.className = "list-group-item text-end";
    mssgElement.innerText = mssg.message + "  |  [ You] ";
    mssgList.append(mssgElement);

    broadcast(mssg);
};


setUserNameBtn.onclick = () => {
    if (!userNameTextBox.value) {
        userNameTextBox.value = userName;
    } else {
        userName = userNameTextBox.value;
        // send current user name
        broadcast({
            type: "username",
            message: userName
        });
    }
};

disconnectBtn.onclick = () => {
    disconnectAll();
    console.log(connections);
};

// --- UTILITY FUNCTIONS ---

function broadcast(data) {
    connections.forEach((conn) => {
        if (conn.open) {
            conn.send(data);
        }
    });
}


function removeFromArray(array, toRemove) {
    const index = array.indexOf(toRemove);
    if (index > -1) {
        array.splice(index, 1);
    }
}


function copyToClipboard(str) {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};