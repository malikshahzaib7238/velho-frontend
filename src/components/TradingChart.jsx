import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";

const TradingChart = ({ market, timeframe = '1D' }) => {
  const timeframes = ['1H', '4H', '1D', '1W', '1M'];
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [chartData, setChartData] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/trade?market=ETH`);
      const data = await response.json();

      // Check if data contains trades property (or adjust based on actual response)
      if (data && Array.isArray(data.trades)) {
        const formattedData = data.trades.map((trade) => ({
          timestamp: new Date(trade.Timestamp / 1000000).toISOString(),
          price: trade.Price,
          volume: trade.Size * trade.Price,
        }));

        // Sort data by timestamp in descending order (latest data will appear on the right)
        formattedData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setChartData(formattedData);
      } else {
        console.error('Invalid data structure:', data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch initial data on mount
    const interval = setInterval(fetchData, 1000); // Fetch data every second (1000ms)

    // Cleanup interval when component unmounts or market/selectedTimeframe changes
    return () => clearInterval(interval);
  }, [market, selectedTimeframe]); // Re-run when `market` or `selectedTimeframe` changes

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    switch (selectedTimeframe) {
      case '1H':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '4H':
        return `${date.getHours()}:00`;
      case '1D':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '1W':
      case '1M':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleString();
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow">
          <p className="text-gray-400">
            {new Date(label).toLocaleString()}
          </p>
          <p className="text-white">
            Price: ${payload[0].value.toFixed(2)}
          </p>
          <p className="text-gray-400">
            Volume: {payload[1].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gray-800 w-full h-[500px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-white">{market} Price Chart</CardTitle>
        <div className="flex space-x-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm ${
                selectedTimeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#9CA3AF"
              reversed={true} // Reverse the X-Axis to show latest data on the right
            />
            <YAxis
              yAxisId="left"
              domain={['auto', 'auto']}
              stroke="#9CA3AF"
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9CA3AF"
              tickFormatter={(value) => `${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              dot={false}
              name="Price"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="volume"
              stroke="#6B7280"
              dot={false}
              name="Volume"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TradingChart;
