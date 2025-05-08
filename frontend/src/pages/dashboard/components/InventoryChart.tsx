import React from 'react';
import { Paper, Typography, Divider } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { InventoryStatus } from '../types';

interface InventoryChartProps {
  data?: InventoryStatus[];
}

const InventoryChart: React.FC<InventoryChartProps> = ({ data = [] }) => {
  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Inventory Status
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, 'Items']} />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default InventoryChart;
