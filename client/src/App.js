import React, { useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

const products = ['ETH-USD', 'ETH-EUR', 'ETH-BTC']; 

function App() {
  const [subscriptions, setSubscriptions] = useState({});
  const [bidsAsks, setBidsAsks] = useState({});
  const [matches, setMatches] = useState([]);
  const [channels, setChannels] = useState([]);

  const socketUrl = 'wss://ws-feed.exchange.coinbase.com'; 

  const {
    sendMessage,
    lastMessage,
    readyState,
  } = useWebSocket(socketUrl, {
    onMessage: (event) => handleData(event.data),
    shouldReconnect: (closeEvent) => true,
  });

  const subscribeMessage = (channel, productIds) => ({
    type: 'subscribe',
    channels: [{ name: channel, product_ids: productIds }],
  });

  const unsubscribeMessage = (channel, productIds) => ({
    type: 'unsubscribe',
    channels: [{ name: channel, product_ids: productIds }],
  });

  const handleSubscription = (product) => {
    if (subscriptions[product]) {
      setSubscriptions((prev) => ({
        ...prev,
        [product]: false,
      }));
      sendMessage(JSON.stringify(unsubscribeMessage('ticker', [product])));
      sendMessage(JSON.stringify(unsubscribeMessage('level2', [product])));
    } else {
      setSubscriptions((prev) => ({
        ...prev,
        [product]: true,
      }));
      sendMessage(JSON.stringify(subscribeMessage('ticker', [product])));
      sendMessage(JSON.stringify(subscribeMessage('level2', [product])));
    }
  };

  const handleData = (data) => { //console.log('data:'+data)
    const parsedData = JSON.parse(data);
    if (parsedData.type === 'ticker') {
      setBidsAsks((prev) => ({
        ...prev,
        [parsedData.product_id]: parsedData,
      }));
      setMatches((prev) => [...prev, parsedData]);
    } else if (parsedData.type === 'subscriptions') {
      setChannels(parsedData.channels);
    }
  };

  return (
    <div className="App">
      <h1>Coinbase Pro WebSocket Feed</h1>

      <section>
        <h2>Subscribe/Unsubscribe</h2>
        {products.map((product) => (
          <button
            key={product}
            onClick={() => handleSubscription(product)}
          >
            {subscriptions[product] ? `Unsubscribe ${product}` : `Subscribe ${product}`}
          </button>
        ))}
      </section>

      <section>
        <h2>Price View</h2>
        {Object.keys(bidsAsks).map((product) => (
          <div key={product}>
            <h3>{product}</h3>
            <pre>{JSON.stringify(bidsAsks[product], null, 2)}</pre>
          </div>
        ))}
      </section>

      <section>
        <h2>Match View</h2>
        <ul>
          {matches.slice(-10).map((match, index) => (
            <li key={index} style={{ color: match.side === 'buy' ? 'green' : 'red' }}>
              {match.time}: {match.product_id} - {match.size} @ {match.price}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>System Status</h2>
        <ul>
          {channels.map((channel, index) => (
            <li key={index}>{channel.name} - {channel.product_ids.join(', ')}</li>
          ))}
        </ul>
      </section>

      <div>
        WebSocket status: {ReadyState[readyState]}
      </div>
    </div>
  );
}

export default App;
