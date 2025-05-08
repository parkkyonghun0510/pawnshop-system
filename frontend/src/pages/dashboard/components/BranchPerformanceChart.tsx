import React from 'react';
import { Paper, Typography, Divider } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BranchPerformance } from '../types';

interface BranchPerformanceChartProps {
  data?: BranchPerformance[];
}

const BranchPerformanceChart: React.FC<BranchPerformanceChartProps> = ({ data = [] }) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Branch Performance
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="loans" name="Loans" fill="#1976d2" />
          <Bar dataKey="revenue" name="Revenue (K)" fill="#2e7d32" />
          <Bar dataKey="items" name="Items" fill="#ed6c02" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default BranchPerformanceChart;
