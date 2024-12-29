import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {  RefreshCw } from 'lucide-react';
import TradingChart from '../components/TradingChart';
import {  Wallet, TrendingUp } from 'lucide-react';


const TradingPage = () => {
  const userID = localStorage.getItem('user');
  const [selectedMarket, setSelectedMarket] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [orderSide, setOrderSide] = useState(true);
  
  const [userId, setUserId] = useState('');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  

  const [orderBook, setOrderBook] = useState({
    asks: [],
    bids: [],
    total_ask_volume: 0,
    total_bid_volume: 0
  });
  const [trades, setTrades] = useState([]);
  const [bestBidPrice, setBestBidPrice] = useState(0);
  const [bestAskPrice, setBestAskPrice] = useState(0);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const markets = ['BTC/USDT'];

  const fetchOrderBook = async () => {
    try {
      const response = await axios.get('http://localhost:3000/trade/orderbook', {
        params: { market: selectedMarket }
      });
      setOrderBook(response.data);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to fetch order book');
      setTimeout(() => setError(null), 5000);
    }
  };

  const fetchBestPrices = async () => {
    try {
      const [bidResponse, askResponse] = await Promise.all([
        axios.get('http://localhost:3000/trade/book/bid', { params: { market: selectedMarket } }),
        axios.get('http://localhost:3000/trade/book/ask', { params: { market: selectedMarket } })
      ]);

      setBestBidPrice(bidResponse.data.price);
      setBestAskPrice(askResponse.data.price);
    } catch (err) {
      setError('Failed to fetch best prices');
      setTimeout(() => setError(null), 5000);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await axios.get('http://localhost:3000/trade', {
        params: { market: selectedMarket }
      });
      setTrades(response.data.trades || []);
    } catch (err) {
      setError('Failed to fetch trades');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handlePlaceOrder = async () => {
    if (!userId) {
      setError('Please enter a user ID');
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
        bid: orderSide,
        market: selectedMarket
      };

      const response = await axios.post('http://localhost:3000/trade/order', orderPayload, {
        params: { user: userId }
      });

      if (response.data.status === 'success') {
        setPrice('');
        setAmount('');
        fetchOrderBook();
        fetchTrades();
        fetchBestPrices();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchOrderBook();
    fetchBestPrices();
    fetchTrades();
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [selectedMarket]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {error && (
console.log(error)
        )}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <TrendingUp className="mr-3" /> Velho Exchange
          </h1>
          <div className="flex items-center space-x-4">
            {!localStorage.getItem('user') ? (
              <button

                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center"
              >
                <Wallet className="mr-2" /> Register
              </button>
            ) : (
              <div className="bg-blue-600 px-4 py-2 rounded">
                User ID: {localStorage.getItem('user').slice(0, 6)}...
              </div>
            )}
          </div>
        </div>



        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-4">
            {markets.map(market => (
              <button 
                key={market}
                className={`px-4 py-2 rounded ${
                  selectedMarket === market 
                    ? 'bg-blue-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setSelectedMarket(market)}
              >
                {market}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <RefreshCw
              className={`text-gray-400 cursor-pointer ${isLoading ? 'animate-spin' : ''}`}
              onClick={refreshData}
            />
            <span className="text-sm text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>

<div className="mb-8">
  <TradingChart market={selectedMarket} timeframe="1D" />
</div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Order Book</h2>
              <span className="text-sm text-gray-400">{selectedMarket}</span>
            </div>
            
            <div className="mb-4">
              <h3 className="text-green-500 font-bold mb-2">
                Bids (Total Volume: {orderBook.total_bid_volume?.toFixed(2)})
              </h3>
              {orderBook.bids.map((bid, index) => (
                <div
                  key={bid.ID || index}
                  className="flex justify-between text-green-400 hover:bg-gray-700 px-2 py-1 rounded"
                >
                  <span>{bid.Price.toFixed(2)}</span>
                  <span>{bid.Size}</span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-red-500 font-bold mb-2">
                Asks (Total Volume: {orderBook.total_ask_volume?.toFixed(2)})
              </h3>
              {orderBook.asks.map((ask, index) => (
                <div
                  key={ask.ID || index}
                  className="flex justify-between text-red-400 hover:bg-gray-700 px-2 py-1 rounded"
                >
                  <span>{ask.Price.toFixed(2)}</span>
                  <span>{ask.Size}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between mb-4">
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

            {orderType === 'LIMIT' && (
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Price</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                  placeholder={`Best ${orderSide ? 'Ask' : 'Bid'}: ${
                    orderSide ? bestAskPrice : bestBidPrice
                  }`}
                  min="0"
                  step="0.01"
                />
              </div>
            )}

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

            <div className="mb-4 flex justify-between">
              <span>Total</span>
              <span>
                {orderType === 'LIMIT' && price && amount
                  ? (parseFloat(price) * parseFloat(amount)).toFixed(2)
                  : '-'
                } USDT
              </span>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={isLoading}
              className={`w-full py-3 rounded ${
                isLoading
                  ? 'bg-gray-600'
                  : orderSide
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? 'Processing...' : `${orderSide ? 'Buy' : 'Sell'} ${selectedMarket}`}
            </button>
          </div>

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
                <span>{trade.Price.toFixed(2)}</span>
                <span>{trade.Size}</span>
                <span className="text-gray-500">
                  {new Date(trade.Timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPage;