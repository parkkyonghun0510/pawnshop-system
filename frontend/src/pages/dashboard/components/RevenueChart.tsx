import React from 'react';
import { Paper, Typography, Divider } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';

interface RevenueChartProps {
  data?: Array<{ date: string; value: number }>;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data = [] }) => {
  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Revenue Trend
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(date) => dayjs(date).format('MMM DD')}
          />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip
            labelFormatter={(date) => dayjs(date).format('MMMM DD, YYYY')}
            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default RevenueChart;
