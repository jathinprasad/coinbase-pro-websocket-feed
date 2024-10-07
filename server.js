const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'client/build')));

// WebSocket connection to Coinbase Pro API
const wss = new WebSocket.Server({ noServer: true });
const socketClients = [];

const coinbaseSocketUrl = 'wss://ws-feed.exchange.coinbase.com';

// Handle client connections
wss.on('connection', (ws) => {
  const coinbaseWs = new WebSocket(coinbaseSocketUrl);
  //console.log('connected to coinbase url');
  coinbaseWs.on('message', (data) => {
    //console.log('Forward Coinbase Pro WebSocket messages to the client: '+ data);
    // Forward Coinbase Pro WebSocket messages to the client
    ws.send(data);
  });

  ws.on('message', (message) => {
    console.log('Forward client messages Coinbase:'+message);
    coinbaseWs.send(message);
  });

  ws.on('close', () => { console.log('close');
    coinbaseWs.close();
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Upgrade HTTP requests to WebSocket
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});
