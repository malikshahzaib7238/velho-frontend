import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, ArrowUpDown, Activity, Wallet, TrendingUp } from 'lucide-react';

// Interfaces matching backend types
interface User {
  ID: string;
  Balance: number;
}

interface Market {
  name: string;
  price: number;
  change: number;
}

interface ExOrder {
  ID: string;
  Size: number;
  Price: number;
  Bid: boolean;
  Market: string;
  Timestamp: string;
}

interface TradingActivity {
  type: 'order' | 'trade';
  details: ExOrder;
}

// Dashboard Component
const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [markets, setMarkets] = useState<Market[]>([
    { name: 'BTC/USDT', price: 0, change: 0 },
    { name: 'ETH/USDT', price: 0, change: 0 },
    { name: 'SOL/USDT', price: 0, change: 0 }
  ]);
  const [recentActivity, setRecentActivity] = useState<TradingActivity[]>([]);
  const [userId, setUserId] = useState<string>('');

  // Fetch user data
  const fetchUserData = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`/user/${userId}`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user data', error);
    }
  };

  // Fetch user orders (recent activity)
  const fetchUserOrders = async () => {
    if (!userId) return;
    try {
      const response = await axios.get('/order', {
        params: { userID: userId }
      });

      const orders = response.data.orders.bids.concat(response.data.orders.asks);
      const formattedActivity: TradingActivity[] = orders.map((order: ExOrder) => ({
        type: 'order',
        details: order
      }));

      setRecentActivity(formattedActivity);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  // Simulate market data (you'd replace this with real price feed)
  const fetchMarketData = async () => {
    const updatedMarkets = await Promise.all(markets.map(async (market) => {
      try {
        const response = await axios.get('/book/bid', {
          params: { market: market.name }
        });
        return {
          ...market,
          price: response.data.price,
          change: Math.random() * 4 - 2  // Random change for demo
        };
      } catch (error) {
        return market;
      }
    }));
    setMarkets(updatedMarkets);
  };

  // User Registration
  const handleUserRegistration = async () => {
    try {
      const response = await axios.post('/user', {
        usd: 10000,  // Default starting balance
        private_key: ''  // Optional: can be generated on backend
      });

      const newUserId = response.data.user;
      setUserId(newUserId);
      alert(`Registered successfully. Your User ID is: ${newUserId}`);
    } catch (error) {
      console.error('Registration failed', error);
    }
  };

  // Initial data fetch and periodic updates
  useEffect(() => {
    fetchMarketData();
    if (userId) {
      fetchUserData();
      fetchUserOrders();
    }

    const intervalId = setInterval(() => {
      fetchMarketData();
      if (userId) {
        fetchUserData();
        fetchUserOrders();
      }
    }, 60000);  // Update every minute

    return () => clearInterval(intervalId);
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <TrendingUp className="mr-3" /> Velho Exchange
          </h1>
          <div className="flex items-center space-x-4">
            {!userId ? (
              <button
                onClick={handleUserRegistration}
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

        {/* User Summary */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Activity className="mr-3" /> Account Overview
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded">
              <p className="text-gray-400">Total Balance</p>
              <p className="text-2xl font-bold">
                ${user?.Balance.toLocaleString() || '0.00'}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded">
              <p className="text-gray-400">Available Balance</p>
              <p className="text-2xl font-bold">
                ${user?.Balance.toLocaleString() || '0.00'}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded">
              <p className="text-gray-400">Pending Orders</p>
              <p className="text-2xl font-bold">{recentActivity.length}</p>
            </div>
          </div>
        </div>

        {/* Market Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Market Prices</h2>
            <button
              onClick={fetchMarketData}
              className="text-gray-400 hover:text-white flex items-center"
            >
              <RefreshCw className="mr-2" /> Refresh
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {markets.map((market) => (
              <div
                key={market.name}
                className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold">{market.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      market.change >= 0 ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {market.change.toFixed(2)}%
                  </span>
                </div>
                <p className="text-2xl font-semibold">${market.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trading Navigation */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <ArrowUpDown className="mr-3" /> Trade
            </h3>
            <a href="/trade" className="w-full block">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded">
                Start Trading
              </button>
            </a>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <div className="bg-gray-700 p-4 rounded text-center text-gray-400">
                No recent activity
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 3).map((activity, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 p-3 rounded flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold">{activity.details.Market}</span>
                      <span className={`ml-2 ${activity.details.Bid ? 'text-green-400' : 'text-red-400'}`}>
                        {activity.details.Bid ? 'Buy' : 'Sell'}
                      </span>
                    </div>
                    <div>
                      <span>{activity.details.Size} @ ${activity.details.Price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;