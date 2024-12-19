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
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

// Types for our chart data
interface PriceData {
  timestamp: string;
  price: number;
  volume: number;
}

interface ChartProps {
  market: string;
  timeframe: string;
}

const TradingChart = ({ market, timeframe = '1D' }: ChartProps) => {
  // Timeframe options
  const timeframes = ['1H', '4H', '1D', '1W', '1M'];
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  
  // Generate dummy data
  const generateDummyData = (timeframe: string): PriceData[] => {
    const data: PriceData[] = [];
    const now = new Date();
    let basePrice = 45000; // Starting price for BTC/USDT
    let points = 100;
    
    // Adjust base price based on market
    if (market.startsWith('ETH')) {
      basePrice = 2500;
    } else if (market.startsWith('SOL')) {
      basePrice = 100;
    }
    
    // Generate random price movements
    for (let i = points; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 3600000); // Hour intervals
      const randomChange = (Math.random() - 0.5) * (basePrice * 0.02); // 2% max change
      const price = basePrice + randomChange;
      const volume = Math.random() * 100 + 50;
      
      basePrice = price; // Use this price as the base for the next point
      
      data.push({
        timestamp: timestamp.toISOString(),
        price: parseFloat(price.toFixed(2)),
        volume: parseFloat(volume.toFixed(2))
      });
    }
    
    return data;
  };

  const [chartData, setChartData] = useState<PriceData[]>([]);

  useEffect(() => {
    // In real implementation, fetch data from backend
    setChartData(generateDummyData(selectedTimeframe));
  }, [market, selectedTimeframe]);

  // Format timestamp based on timeframe
  const formatXAxis = (timestamp: string) => {
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
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