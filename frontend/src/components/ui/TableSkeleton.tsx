import React from 'react';
import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';

interface TableSkeletonProps {
  rowCount?: number;
  columnCount?: number;
  showHeader?: boolean;
  headerHeight?: number;
  rowHeight?: number;
  animation?: 'pulse' | 'wave';
  withPaper?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rowCount = 10,
  columnCount = 5,
  showHeader = true,
  headerHeight = 56,
  rowHeight = 53,
  animation = 'pulse',
  withPaper = true,
}) => {
  const theme = useTheme();

  const tableContent = (
    <TableContainer sx={{ maxHeight: 440, overflow: 'hidden' }}>
      <Table stickyHeader aria-label="loading table">
        {showHeader && (
          <TableHead>
            <TableRow>
              {Array(columnCount)
                .fill(0)
                .map((_, index) => (
                  <TableCell key={`header-${index}`} sx={{ height: headerHeight }}>
                    <Skeleton 
                      animation={animation} 
                      height={24} 
                      width={`${Math.floor(Math.random() * 50) + 50}%`} 
                    />
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {Array(rowCount)
            .fill(0)
            .map((_, rowIndex) => (
              <TableRow key={`row-${rowIndex}`} sx={{ height: rowHeight }}>
                {Array(columnCount)
                  .fill(0)
                  .map((_, colIndex) => (
                    <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                      <Skeleton 
                        animation={animation} 
                        height={24} 
                        width={`${Math.floor(Math.random() * 70) + 30}%`} 
                      />
                    </TableCell>
                  ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return withPaper ? (
    <Paper 
      sx={{ 
        width: '100%', 
        overflow: 'hidden', 
        borderRadius: 2,
        boxShadow: theme.shadows[1],
      }}
    >
      {tableContent}
    </Paper>
  ) : (
    tableContent
  );
};

export default TableSkeleton;
