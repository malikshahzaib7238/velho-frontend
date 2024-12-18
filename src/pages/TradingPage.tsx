import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpDown, RefreshCw } from 'lucide-react';

// Interfaces based on your backend types
interface ExOrder {
  ID?: string;
  Size: number;
  Price: number;
  Bid: boolean;
  UserID: string;
  Timestamp: string;
  Market: string;
}

interface OrderBookResponse {
  asks: ExOrder[];
  bids: ExOrder[];
  totalAskVolume: number;
  totalBidVolume: number;
}

interface Trade {
  price: number;
  size: number;
  timestamp: string;
  side: 'buy' | 'sell';
}

const TradingPage: React.FC = () => {
  // State for market and order configuration
  const [selectedMarket, setSelectedMarket] = useState<string>('BTC/USDT');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [orderSide, setOrderSide] = useState<boolean>(true); // true for bid/buy, false for ask/sell
  
  // User and order states
  const [userId, setUserId] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  
  // Data states
  const [orderBook, setOrderBook] = useState<OrderBookResponse>({
    asks: [],
    bids: [],
    totalAskVolume: 0,
    totalBidVolume: 0
  });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [bestBidPrice, setBestBidPrice] = useState<number>(0);
  const [bestAskPrice, setBestAskPrice] = useState<number>(0);
  
  // Error and loading states
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Markets list
  const markets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

  // Fetch order book
  const fetchOrderBook = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/orderbook', {
        params: { market: selectedMarket }
      });
      setOrderBook(response.data);
    } catch (err) {
      // setError('Failed to fetch order book');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch best prices
  const fetchBestPrices = async () => {
    try {
      const bidResponse = await axios.get('/book/bid', {
        params: { market: selectedMarket }
      });
      const askResponse = await axios.get('/book/ask', {
        params: { market: selectedMarket }
      });

      setBestBidPrice(bidResponse.data.price);
      setBestAskPrice(askResponse.data.price);
    } catch (err) {
      // setError('Failed to fetch best prices');
    }
  };

  // Fetch trades
  const fetchTrades = async () => {
    try {
      const response = await axios.get('/trade', {
        params: { market: selectedMarket }
      });

      // Transform trades to match frontend interface
      const formattedTrades = response.data.trades.map((trade: any) => ({
        price: trade.Price,
        size: trade.Size,
        timestamp: new Date(trade.Timestamp).toLocaleString(),
        side: trade.Bid ? 'buy' : 'sell'
      }));

      setTrades(formattedTrades);
    } catch (err) {
      // setError('Failed to fetch trades');
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    // Validate inputs
    if (!userId) {
      setError('Please log in first');
      return;
    }

    try {
      const orderPayload = {
        order_type: orderType,
        price: orderType === 'LIMIT' ? parseFloat(price) : 0,
        size: parseInt(amount),
        bid: orderSide,
        market: selectedMarket
      };

      const response = await axios.post('/order', orderPayload, {
        params: { user: userId }
      });

      // Handle successful order placement
      alert(`Order placed successfully. Order ID: ${response.data.id}`);

      // Reset form and refresh data
      setPrice('');
      setAmount('');
      fetchOrderBook();
      fetchTrades();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place order');
    }
  };

  // Fetch data on component mount and market change
  useEffect(() => {
    fetchOrderBook();
    fetchBestPrices();
    fetchTrades();
  }, [selectedMarket]);

  // Render error if exists
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
        <button
          onClick={() => setError(null)}
          className="absolute top-0 right-0 px-4 py-3"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* User ID Input (for testing) */}
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2"
            placeholder="Enter User ID"
          />
        </div>

        {/* Market Selector */}
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
              className="text-gray-400 cursor-pointer"
              onClick={() => {
                fetchOrderBook();
                fetchBestPrices();
                fetchTrades();
              }}
            />
            <span className="text-sm text-gray-400">Last updated: Just now</span>
          </div>
        </div>

        {/* Trading Interface */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Book */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Order Book</h2>
              <span className="text-sm text-gray-400">{selectedMarket}</span>
            </div>
            
            {/* Bids */}
            <div className="mb-4">
              <h3 className="text-green-500 font-bold mb-2">Bids (Total Volume: {orderBook.totalBidVolume})</h3>
              {orderBook.bids.map((bid, index) => (
                <div
                  key={index}
                  className="flex justify-between text-green-400 hover:bg-gray-700 px-2 py-1 rounded"
                >
                  <span>{bid.Price.toFixed(2)}</span>
                  <span>{bid.Size}</span>
                </div>
              ))}
            </div>

            {/* Asks */}
            <div>
              <h3 className="text-red-500 font-bold mb-2">Asks (Total Volume: {orderBook.totalAskVolume})</h3>
              {orderBook.asks.map((ask, index) => (
                <div
                  key={index}
                  className="flex justify-between text-red-400 hover:bg-gray-700 px-2 py-1 rounded"
                >
                  <span>{ask.Price.toFixed(2)}</span>
                  <span>{ask.Size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Form */}
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

            {/* Price Input (for Limit Orders) */}
            {orderType === 'LIMIT' && (
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Price</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                  placeholder={`Enter price (Best ${orderSide ? 'Ask' : 'Bid'}: ${orderSide ? bestAskPrice : bestBidPrice})`}
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
              />
            </div>

            {/* Total */}
            <div className="mb-4 flex justify-between">
              <span>Total</span>
              <span>
                {orderType === 'LIMIT'
                  ? (parseFloat(price) * parseFloat(amount)).toFixed(2)
                  : '-'
                } USDT
              </span>
            </div>

            {/* Place Order Button */}
            <button 
              onClick={handlePlaceOrder}
              className={`w-full py-3 rounded ${
                orderSide
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {orderSide ? 'Buy' : 'Sell'} {selectedMarket}
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
                  trade.side === 'buy' 
                    ? 'text-green-400 hover:bg-green-900/20' 
                    : 'text-red-400 hover:bg-red-900/20'
                }`}
              >
                <span>{trade.price.toFixed(2)}</span>
                <span>{trade.size}</span>
                <span className="text-gray-500">{trade.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPage;