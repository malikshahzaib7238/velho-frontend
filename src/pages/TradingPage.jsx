import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Wallet, TrendingUp } from 'lucide-react';
import TradingChart from '../components/TradingChart';

const TradingPage = () => {
  const API_BASE_URL = 'http://localhost:3000';
  
  // User state
  const [userId, setUserId] = useState(localStorage.getItem('user') || '');

  // Market state
  const [selectedMarket, setSelectedMarket] = useState('BTC');
  const [orderType, setOrderType] = useState('LIMIT');
  const [orderSide, setOrderSide] = useState(true); // true for buy, false for sell
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderBook, setOrderBook] = useState({
    asks: [],
    bids: [],
    total_ask_volume: 0,
    total_bid_volume: 0
  });
  const [bestBidPrice, setBestBidPrice] = useState(0);
  const [bestAskPrice, setBestAskPrice] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [trades, setTrades] = useState([]);

  // Handle user registration
  const handleRegister = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/user`, {
        private_key: "",
        usd: 10000.0
      });

      if (response.data.status === 'success' && response.data.user) {
        localStorage.setItem('user', response.data.user);
        setUserId(response.data.user);
        setError(null);
      }
    } catch (err) {
      setError('Failed to register user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (!userId) {
      setError('Please register first');
      return;
    }

    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price for limit order');
      return;
    }

    try {
      setIsLoading(true);
      const orderPayload = {
        order_type: orderType,
        price: orderType === 'LIMIT' ? parseFloat(price) : 0,
        size: parseInt(amount),
        bid: orderSide, // true for buy, false for sell
        market: selectedMarket
      };

      const response = await axios.post(`${API_BASE_URL}/order`, orderPayload, {
        params: { user: userId }
      });

      if (response.data.status === 'success') {
        // Clear form and refresh data
        setPrice('');
        setAmount('');
        setError(null);

        // Refresh all market data
        await Promise.all([
          fetchOrderBook(),
          fetchBestPrices(),
          fetchTrades()
        ]);
      }
    } catch (err) {
      if (err.response?.status === 417) {
        setError('Insufficient volume for market order');
      } else if (err.response?.status === 400) {
        setError('Invalid order parameters');
      } else {
        setError('Failed to place order');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Market data fetching functions
  const fetchOrderBook = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orderbook`, {
        params: { market: selectedMarket }
      });
      setOrderBook(response.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch order book:', err);
    }
  };

  const fetchBestPrices = async () => {
    try {
      const [bidResponse, askResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/book/bid`, {
          params: { market: selectedMarket }
        }),
        axios.get(`${API_BASE_URL}/book/ask`, {
          params: { market: selectedMarket }
        })
      ]);

      setBestBidPrice(bidResponse.data.price);
      setBestAskPrice(askResponse.data.price);
    } catch (err) {
      console.error('Failed to fetch best prices:', err);
    }
  };


  const fetchTrades = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trade?market=BTC`);
      const timestampInSeconds = response.data.Timestamp / 1000000000;

// Create a new Date object
    const date = new Date(timestampInSeconds * 1000); // Convert to milliseconds

// Format the date as needed
    const formattedDate = date.toLocaleString(); // e.g., "12/30/2024, 9:36:19 PM"
response.data.Timestamp = formattedDate;
      if (response.data.status === 'success') {
        setTrades(response.data.trades || []);
      }
    } catch (err) {
      console.error('Failed to fetch trades:', err);
    }
  };
  // Function to convert the nanosecond timestamp to a human-readable date
const convertTimestamp = (timestamp) => {
  // Convert nanoseconds to seconds
  const timestampInSeconds = timestamp / 1000000000;

  // Create a Date object and return the formatted time
  const date = new Date(timestampInSeconds * 1000);
  return date.toLocaleTimeString(); // You can adjust the format here if needed
};


  // Auto-update market data
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchOrderBook(),
        fetchBestPrices(),
        fetchTrades()
      ]);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedMarket]);

  // Helper function to format numbers
  const formatPrice = (num) => (typeof num === 'number' ? num.toFixed(2) : '0.00');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <TrendingUp className="mr-3" /> Velho Exchange
          </h1>
          <div className="flex items-center space-x-4">
            {!userId ? (
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center"
              >
                <Wallet className="mr-2" /> Register
              </button>
            ) : (
              <div className="bg-blue-600 px-4 py-2 rounded">
                User ID: {userId.slice(0, 6)}...
              </div>
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {/* Trading interface */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Book */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Order Book</h2>
              <span className="text-sm text-gray-400">{selectedMarket}</span>
            </div>
            
            {/* Asks */}
            <div className="mb-4">
              <h3 className="text-red-500 font-bold mb-2">
                Asks (Total Volume: {formatPrice(orderBook.total_ask_volume)})
              </h3>
              {orderBook.asks.map((ask, index) => (
                <div
                  key={ask.ID || index}
                  className="flex justify-between text-red-400 hover:bg-gray-700 px-2 py-1 rounded cursor-pointer"
                  onClick={() => {
                    setOrderSide(true); // Buy
                    setPrice(ask.Price.toString());
                  }}
                >
                  <span>{formatPrice(ask.Price)}</span>
                  <span>{ask.Size}</span>
                </div>
              ))}
            </div>

            {/* Bids */}
            <div>
              <h3 className="text-green-500 font-bold mb-2">
                Bids (Total Volume: {formatPrice(orderBook.total_bid_volume)})
              </h3>
              {orderBook.bids.map((bid, index) => (
                <div
                  key={bid.ID || index}
                  className="flex justify-between text-green-400 hover:bg-gray-700 px-2 py-1 rounded cursor-pointer"
                  onClick={() => {
                    setOrderSide(false); // Sell
                    setPrice(bid.Price.toString());
                  }}
                >
                  <span>{formatPrice(bid.Price)}</span>
                  <span>{bid.Size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Form */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between mb-4">
              {/* Buy/Sell Toggle */}
              <div className="flex space-x-2">
                <button 
                  className={`px-4 py-2 rounded ${
                    orderSide
                      ? 'bg-green-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setOrderSide(true)}
                >
                  Buy
                </button>
                <button 
                  className={`px-4 py-2 rounded ${
                    !orderSide
                      ? 'bg-red-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setOrderSide(false)}
                >
                  Sell
                </button>
              </div>

              {/* Order Type Toggle */}
              <div className="flex space-x-2">
                <button 
                  className={`px-4 py-2 rounded ${
                    orderType === 'LIMIT'
                      ? 'bg-blue-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setOrderType('LIMIT')}
                >
                  Limit
                </button>
                <button 
                  className={`px-4 py-2 rounded ${
                    orderType === 'MARKET'
                      ? 'bg-blue-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setOrderType('MARKET')}
                >
                  Market
                </button>
              </div>
            </div>

            {/* Price Input (for Limit Orders) */}
            {orderType === 'LIMIT' && (
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Price</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                  placeholder={`Best ${orderSide ? 'Ask' : 'Bid'}: ${
                    orderSide ? formatPrice(bestAskPrice) : formatPrice(bestBidPrice)
                  }`}
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-gray-400 mb-2">Amount</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2"
                placeholder="Enter amount"
                min="0"
                step="1"
              />
            </div>

            {/* Total */}
            <div className="mb-4 flex justify-between">
              <span>Total</span>
              <span>
                {orderType === 'LIMIT' && price && amount
                  ? formatPrice(parseFloat(price) * parseFloat(amount))
                  : '-'
                } USD
              </span>
            </div>

            {/* Place Order Button */}
            <button 
              onClick={handlePlaceOrder}
              disabled={isLoading || !userId}
              className={`w-full py-3 rounded ${
                !userId
                  ? 'bg-gray-600'
                  : isLoading
                    ? 'bg-gray-600'
                    : orderSide
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {!userId
                ? 'Please Register First'
                : isLoading
                  ? 'Processing...'
                  : `${orderSide ? 'Buy' : 'Sell'} ${selectedMarket}`}
            </button>
          </div>

          {/* Recent Trades */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Trades</h2>
              <span className="text-sm text-gray-400">{selectedMarket}</span>
            </div>
            {trades.map((trade, index) => (
              <div 
                key={index} 
                className={`flex justify-between px-2 py-1 rounded ${
                  trade.Bid
                    ? 'text-green-400 hover:bg-green-900/20' 
                    : 'text-red-400 hover:bg-red-900/20'
                }`}
              >
                <span>{formatPrice(trade.Price)}</span>
                <span>{trade.Size}</span>
                <span className="text-gray-500">
  {convertTimestamp(trade.Timestamp)}
</span>
              </div>
            ))}
          </div>
        </div>
      <div className="mb-8 mt-3">
  <TradingChart market={selectedMarket} timeframe="1D" />
</div>
      </div>
    </div>
  );
};

export default TradingPage;