import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  alpha,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { FixedSizeList as List } from 'react-window';
import TableSkeleton from './TableSkeleton';

// Types
type Order = 'asc' | 'desc';

interface Column<T> {
  id: keyof T | 'actions' | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row?: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  title?: string;
  loading?: boolean;
  error?: string | null;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  showActions?: boolean;
  emptyMessage?: string;
  elevation?: number;
  pagination?: boolean;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  page?: number;
  virtualized?: boolean;
  rowHeight?: number;
  maxHeight?: number;
  loadingRowCount?: number;
  skeletonAnimation?: 'pulse' | 'wave';
}

function DataTable<T>({
  columns,
  data,
  keyField,
  title,
  loading = false,
  error = null,
  selectable = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  showActions = false,
  emptyMessage = 'No data available',
  elevation = 1,
  pagination = true,
  initialRowsPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  page: externalPage,
  virtualized = false,
  rowHeight = 53,
  maxHeight = 440,
  loadingRowCount = 10,
  skeletonAnimation = 'pulse',
}: DataTableProps<T>) {
  const theme = useTheme();
  const [selected, setSelected] = useState<(T[keyof T])[]>([]);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof T | null>(null);
  const [page, setPage] = useState(externalPage || 0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  // Handle sort
  const handleRequestSort = (property: keyof T) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle select all
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n[keyField]);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  // Handle row selection
  const handleClick = (event: React.MouseEvent<unknown>, id: T[keyof T]) => {
    if (!selectable) return;

    const selectedIndex = selected.indexOf(id);
    let newSelected: (T[keyof T])[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    }
  };

  // Check if row is selected
  const isSelected = (id: T[keyof T]) => selected.indexOf(id) !== -1;

  // Calculate empty rows
  const emptyRows = pagination
    ? Math.max(0, (1 + page) * rowsPerPage - (totalCount || data.length))
    : 0;

  // Container ref for virtualized list
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width for virtualized list
  useEffect(() => {
    if (containerRef.current && virtualized) {
      setContainerWidth(containerRef.current.offsetWidth);

      const handleResize = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [virtualized]);

  // Row renderer for virtualized list
  const RowRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = data[pagination ? page * rowsPerPage + index : index];
    if (!row) return null;

    const isItemSelected = isSelected(row[keyField]);
    const labelId = `enhanced-table-checkbox-${index}`;

    return (
      <TableRow
        hover
        onClick={(event) => {
          if (selectable) {
            handleClick(event, row[keyField]);
          } else if (onRowClick) {
            onRowClick(row);
          }
        }}
        role="checkbox"
        aria-checked={isItemSelected}
        tabIndex={-1}
        key={row[keyField]?.toString() || index}
        selected={isItemSelected}
        sx={{ ...style, cursor: onRowClick || selectable ? 'pointer' : 'default', display: 'flex' }}
      >
        {selectable && (
          <TableCell padding="checkbox" sx={{ flex: '0 0 auto' }}>
            <Checkbox
              checked={isItemSelected}
              inputProps={{ 'aria-labelledby': labelId }}
            />
          </TableCell>
        )}

        {columns.map((column) => {
          const value = column.id !== 'actions' ? row[column.id as keyof T] : null;
          const width = column.minWidth || 100;
          const flexBasis = `${width}px`;

          return (
            <TableCell
              key={column.id.toString()}
              align={column.align || 'left'}
              sx={{
                flex: column.id === 'actions' ? '0 0 auto' : `1 1 ${flexBasis}`,
                minWidth: column.id === 'actions' ? 120 : width,
                maxWidth: column.id === 'actions' ? 120 : 'auto',
              }}
            >
              {column.format ? column.format(value, row) : value}
            </TableCell>
          );
        })}

        {showActions && (
          <TableCell align="right" sx={{ flex: '0 0 120px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {onView && (
                <Tooltip title="View">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(row);
                    }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {onEdit && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(row);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {onDelete && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(row);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </TableCell>
        )}
      </TableRow>
    );
  };

  // Render table toolbar
  const renderTableToolbar = () => {
    const numSelected = selected.length;

    return (
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(numSelected > 0 && {
            bgcolor: (theme) =>
              alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
          }),
        }}
      >
        {numSelected > 0 ? (
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} selected
          </Typography>
        ) : (
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            {title}
          </Typography>
        )}

        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    );
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }} elevation={elevation}>
      {title && renderTableToolbar()}

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !virtualized ? (
        <TableSkeleton
          rowCount={loadingRowCount}
          columnCount={columns.length + (selectable ? 1 : 0) + (showActions ? 1 : 0)}
          animation={skeletonAnimation}
          withPaper={false}
        />
      ) : (
        <TableContainer
          sx={{ maxHeight: maxHeight }}
          ref={containerRef}
        >
          <Table
            stickyHeader
            aria-label="sticky table"
            size="medium"
            sx={virtualized ? { tableLayout: 'fixed', width: '100%' } : undefined}
          >
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell
                    padding="checkbox"
                    sx={virtualized ? { flex: '0 0 auto', display: 'flex', alignItems: 'center' } : undefined}
                  >
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < data.length}
                      checked={data.length > 0 && selected.length === data.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'select all' }}
                    />
                  </TableCell>
                )}

                {columns.map((column) => {
                  const width = column.minWidth || 100;
                  const flexBasis = `${width}px`;

                  return (
                    <TableCell
                      key={column.id.toString()}
                      align={column.align || 'left'}
                      style={{ minWidth: width }}
                      sortDirection={orderBy === column.id ? order : false}
                      sx={virtualized ? {
                        flex: column.id === 'actions' ? '0 0 auto' : `1 1 ${flexBasis}`,
                        minWidth: column.id === 'actions' ? 120 : width,
                        maxWidth: column.id === 'actions' ? 120 : 'auto',
                      } : undefined}
                    >
                      {column.sortable !== false ? (
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleRequestSort(column.id as keyof T)}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  );
                })}

                {showActions && (
                  <TableCell
                    align="right"
                    style={{ minWidth: 120 }}
                    sx={virtualized ? { flex: '0 0 120px' } : undefined}
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            {!virtualized ? (
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (selectable ? 1 : 0) + (showActions ? 1 : 0)}
                      align="center"
                      sx={{ py: 5 }}
                    >
                      <CircularProgress size={40} />
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        Loading data...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (selectable ? 1 : 0) + (showActions ? 1 : 0)}
                      align="center"
                      sx={{ py: 5 }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          {emptyMessage}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  data
                    .slice(pagination ? page * rowsPerPage : 0, pagination ? page * rowsPerPage + rowsPerPage : data.length)
                    .map((row, index) => {
                      const isItemSelected = isSelected(row[keyField]);
                      const labelId = `enhanced-table-checkbox-${index}`;

                      return (
                        <TableRow
                          hover
                          onClick={(event) => {
                            if (selectable) {
                              handleClick(event, row[keyField]);
                            } else if (onRowClick) {
                              onRowClick(row);
                            }
                          }}
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          key={row[keyField]?.toString() || index}
                          selected={isItemSelected}
                          sx={{ cursor: onRowClick || selectable ? 'pointer' : 'default' }}
                        >
                          {selectable && (
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isItemSelected}
                                inputProps={{ 'aria-labelledby': labelId }}
                              />
                            </TableCell>
                          )}

                          {columns.map((column) => {
                            const value = column.id !== 'actions' ? row[column.id as keyof T] : null;
                            return (
                              <TableCell key={column.id.toString()} align={column.align || 'left'}>
                                {column.format ? column.format(value, row) : value}
                              </TableCell>
                            );
                          })}

                          {showActions && (
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                {onView && (
                                  <Tooltip title="View">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onView(row);
                                      }}
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {onEdit && (
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(row);
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {onDelete && (
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(row);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                )}

                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell
                      colSpan={columns.length + (selectable ? 1 : 0) + (showActions ? 1 : 0)}
                    />
                  </TableRow>
                )}
              </TableBody>
            ) : (
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (selectable ? 1 : 0) + (showActions ? 1 : 0)}
                      align="center"
                      sx={{ py: 5 }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          {emptyMessage}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  <List
                    height={Math.min(rowHeight * Math.min(data.length, pagination ? rowsPerPage : data.length), maxHeight - 56)}
                    width={containerWidth || '100%'}
                    itemCount={pagination ? Math.min(rowsPerPage, data.length - page * rowsPerPage) : data.length}
                    itemSize={rowHeight}
                    overscanCount={5}
                  >
                    {RowRenderer}
                  </List>
                )}
              </TableBody>
            )}
          </Table>
        </TableContainer>
      )}

      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={totalCount || data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
}

export default DataTable;
