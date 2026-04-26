import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({ 
  columns, 
  data, 
  searchable = true,
  searchPlaceholder = 'Search...',
  pagination = true,
  itemsPerPage = 10,
  onRowClick = null,
  rowClassName = '',
  emptyMessage = 'No data found'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key}
                  className={`px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.title}
                    {col.sortable !== false && sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr 
                  key={row.id || index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="px-3 sm:px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page 
                    ? 'bg-indigo-600 text-white' 
                    : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
