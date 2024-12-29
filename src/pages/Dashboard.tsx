import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, ArrowUpDown, Activity, Wallet, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const userID = localStorage.getItem('user');
  const [user, setUser] = useState(null);
  const [markets, setMarkets] = useState([
    { name: 'BTC/USDT', price: 0, change: 0 },
    { name: 'ETH/USDT', price: 0, change: 0 },
    { name: 'SOL/USDT', price: 0, change: 0 }
  ]);
  // const [userBalance, setUserBalance] = useState(0); // State to store the balance

  const [recentActivity, setRecentActivity] = useState([]);
  const [userId, setUserId] = useState('');

  const fetchUserData = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`http://localhost:3000/trade/user/${userID}`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user data', error);
    }
  };

  const fetchUserOrders = async () => {
    if (!userId) return;
    try {
      const response = await axios.get('http://localhost:3000/order', {
        params: { userID: userId }
      });

      const orders = response.data.orders.bids.concat(response.data.orders.asks);
      const formattedActivity = orders.map(order => ({
        type: 'order',
        details: order
      }));

      setRecentActivity(formattedActivity);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const fetchMarketData = async () => {
    const updatedMarkets = await Promise.all(markets.map(async (market) => {
      try {
        const response = await axios.get('http://localhost:3000/book/bid', {
          params: { market: market.name }
        });
        return {
          ...market,
          price: response.data.price,
          change: Math.random() * 4 - 2
        };
      } catch (error) {
        return market;
      }
    }));
    setMarkets(updatedMarkets);
  };

  const handleUserRegistration = async () => {
    try {
      const response = await axios.post('http://localhost:3000/user', {
        usd: 10000,
        private_key: ''
      });

      const newUserId = response.data.user;
      localStorage.setItem('user', newUserId);
      setUserId(newUserId); // Trigger re-render with the new user ID
      alert(`Registered successfully. Your User ID is: ${newUserId}`);

      // Fetch user balance after registration
      const userBalanceResponse = await axios.get(`http://localhost:3000/user/${newUserId}`);
      setUserBalance(userBalanceResponse.data.user.USD); // Update balance
    } catch (error) {
      console.error('Registration failed', error);
    }
  };

  const [userBalance, setUserBalance] = useState(0); // State to store the balance

    useEffect(() => {
      const getUserBalance = async () => {
        try {
          const user = localStorage.getItem('user');

          const response = await axios.get(`http://localhost:3000/user/${userID}`);

          // Assuming the response contains the balance as user.USD
          const balance = response.data.user.USD;
          setUserBalance(balance); // Update the state with the balance
        } catch (error) {
          console.error('Failed to fetch user balance', error);
        }
      };

      getUserBalance(); // Call the function on component mount
    }, []); // Empty array ensures this runs only once when the component mounts


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
    }, 60000);

    return () => clearInterval(intervalId);
  }, [userId]);
  const logout = () => {
    // Remove the user ID from localStorage
    localStorage.removeItem('user');

    // Reset the userId state and other relevant states
    setUserId('');
    setUser(null);
    setUserBalance(0); // Optional: Reset user balance if needed
    setRecentActivity([]); // Optional: Reset recent activity
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <TrendingUp className="mr-3" /> Velho Exchange
          </h1>
          <div className="flex items-center space-x-4">
  {!localStorage.getItem('user') ? (
    <button
      onClick={handleUserRegistration}
      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center"
    >
      <Wallet className="mr-2" /> Register
    </button>
  ) : (
    <>
      <div className="bg-blue-600 px-4 py-2 rounded">
        User ID: {localStorage.getItem('user').slice(0, 6)}...
      </div>
      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center"
      >
        Logout
      </button>
    </>
  )}
</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Activity className="mr-3" /> Account Overview
          </h2>
            <div className="bg-gray-700 p-4 rounded">
              <p className="text-gray-400">Total Balance</p>
              <p className="text-2xl font-bold">
                ${userBalance?.toLocaleString() || '0.00'}
              </p>
            </div>


        </div>

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

        <div className="grid md:grid-cols-2 gap-6">
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
