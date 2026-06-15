import React, { useEffect } from 'react'
import * as XLSX from 'xlsx'

// Define which columns to display in the table
const DISPLAY_COLUMNS = [
  'item_id',
  'customer_id',
  'unit_price',
  'base_price',
  'price_page_description',
  'contract_number',
  'quantity',
  'sales_location_id',
  'source_location_id'
]

// Columns to show in expandable details
const DETAIL_COLUMNS = [
  'customer_name',
  'calculation_value',
  'calculation_method_cd',
  'commission_cost',
  'inv_mast_uid',
  'price_page_uid',
  'price_page_category',
  'effective_date',
  'expiration_date'
]

// Columns that should be formatted as currency (with $ and thousand separator)
const CURRENCY_COLUMNS = ['base_price', 'unit_price']

// Columns that should show relative time
const DATE_COLUMNS = ['effective_date', 'expiration_date']

// Numeric columns that should be right-aligned
const NUMERIC_COLUMNS = ['base_price', 'calculation_value', 'commission_cost', 'inv_mast_uid', 'price_page_uid', 'quantity', 'sales_location_id', 'source_location_id', 'unit_price']

function ResultsDisplay({ data }) {
  // Track which rows are expanded
  const [expandedRows, setExpandedRows] = React.useState({})

  const toggleRowExpanded = (rowIdx) => {
    console.log(`🔄 Toggling expand for row ${rowIdx}`)
    setExpandedRows(prev => ({
      ...prev,
      [rowIdx]: !prev[rowIdx]
    }))
  }

  // Format relative time (e.g., "3 days ago", "in 2 months")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    // Format date as YYYY-MM-DD
    const dateOnly = dateString.split('T')[0]
    
    if (diffDays === 0) {
      return `${dateOnly} (today)`
    } else if (diffDays === 1) {
      return `${dateOnly} (yesterday)`
    } else if (diffDays === -1) {
      return `${dateOnly} (tomorrow)`
    } else if (diffDays > 0) {
      if (diffDays < 30) {
        return `${dateOnly} (${diffDays} days ago)`
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return `${dateOnly} (${months} month${months > 1 ? 's' : ''} ago)`
      } else {
        const years = Math.floor(diffDays / 365)
        return `${dateOnly} (${years} year${years > 1 ? 's' : ''} ago)`
      }
    } else {
      const futureDays = Math.abs(diffDays)
      if (futureDays < 30) {
        return `${dateOnly} (in ${futureDays} days)`
      } else if (futureDays < 365) {
        const months = Math.floor(futureDays / 30)
        return `${dateOnly} (in ${months} month${months > 1 ? 's' : ''})`
      } else {
        const years = Math.floor(futureDays / 365)
        return `${dateOnly} (in ${years} year${years > 1 ? 's' : ''})`
      }
    }
  }

  // Format value based on column type
  const formatValue = (value, columnName) => {
    if (value === null || value === undefined) {
      return '-'
    }

    if (DATE_COLUMNS.includes(columnName)) {
      return formatRelativeTime(value)
    }

    if (CURRENCY_COLUMNS.includes(columnName) && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    }

    return String(value)
  }

  // Format column names to be more readable
  const formatColumnName = (col) => {
    return col
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Export data to Excel
  const exportToExcel = () => {
    try {
      console.log('📥 Starting Excel export...')
      
      // Define column order for export
      const prioritizedColumns = [
        'customer_id',
        'customer_name',
        'item_id',
        'inv_mast_uid',
        'unit_price',
        'base_price',
        'price_page_description',
        'contract_number',
        'price_page_uid',
        'effective_date',
        'expiration_date'
      ]
      
      // Prepare data for export with column ordering
      const exportData = data.data.map((row) => {
        const exportRow = {}
        
        // First, add prioritized columns in order
        prioritizedColumns.forEach(key => {
          if (row.hasOwnProperty(key)) {
            const displayName = formatColumnName(key)
            let value = row[key]
            if (CURRENCY_COLUMNS.includes(key) && typeof value === 'number') {
              value = parseFloat(value.toFixed(2))
            }
            exportRow[displayName] = value
          }
        })
        
        // Then, add remaining columns
        Object.keys(row).forEach(key => {
          if (!prioritizedColumns.includes(key)) {
            const displayName = formatColumnName(key)
            let value = row[key]
            if (CURRENCY_COLUMNS.includes(key) && typeof value === 'number') {
              value = parseFloat(value.toFixed(2))
            }
            exportRow[displayName] = value
          }
        })
        
        return exportRow
      })
      
      // Create a new workbook
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Pricing Results')
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(col => ({
        wch: Math.max(col.length, 15)
      }))
      ws['!cols'] = colWidths
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `price-inquiry-${timestamp}.xlsx`
      
      // Write file
      XLSX.writeFile(wb, filename)
      console.log(`✅ Excel export completed: ${filename}`)
    } catch (err) {
      console.error('❌ Error exporting to Excel:', err)
      alert('Failed to export to Excel. Please try again.')
    }
  }

  // Generate CSV format with same column order as Excel export
  const generateCSV = () => {
    try {
      // Define column order for export (same as Excel)
      const prioritizedColumns = [
        'customer_id',
        'customer_name',
        'item_id',
        'inv_mast_uid',
        'unit_price',
        'base_price',
        'price_page_description',
        'contract_number',
        'price_page_uid',
        'effective_date',
        'expiration_date'
      ]

      // Determine all columns in order
      const allColumns = []
      
      // Add prioritized columns
      prioritizedColumns.forEach(col => {
        if (results[0].hasOwnProperty(col)) {
          allColumns.push(col)
        }
      })
      
      // Add remaining columns
      Object.keys(results[0]).forEach(col => {
        if (!prioritizedColumns.includes(col)) {
          allColumns.push(col)
        }
      })

      // Create header row
      const headers = allColumns.map(col => formatColumnName(col)).join(',')

      // Create data rows
      const rows = results.map(row => {
        return allColumns.map(col => {
          let value = row[col]
          
          // Format value
          if (value === null || value === undefined) {
            return ''
          }
          
          // Quote if contains comma or newline
          let stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            stringValue = '"' + stringValue.replace(/"/g, '""') + '"'
          }
          
          return stringValue
        }).join(',')
      })

      // Combine header and data rows
      return [headers, ...rows].join('\n')
    } catch (err) {
      console.error('❌ Error generating CSV:', err)
      return 'Error generating CSV'
    }
  }

  useEffect(() => {
    console.log('📊 ResultsDisplay Component Mounted')
    console.log('   Data:', data)
    console.log('   Display Columns:', DISPLAY_COLUMNS)
  }, [data])

  if (!data || !data.data || data.data.length === 0) {
    console.warn('⚠️  No results to display')
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">No results found</p>
      </div>
    )
  }

  const results = data.data
  const firstRow = results[0]
  const allColumns = Object.keys(firstRow)
  const displayColumns = DISPLAY_COLUMNS.filter(col => allColumns.includes(col))
  
  console.log(`✓ Displaying ${results.length} result(s)`)
  console.log(`  Table Columns: ${displayColumns.join(', ')}`)
  console.log(`  All Available Columns: ${allColumns.join(', ')}`)

  return (
    <div className="space-y-4">
      {/* Pricing Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Record count badge */}
            <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
              {data.count} record{data.count !== 1 ? 's' : ''}
            </span>
            
            {/* Customer info */}
            <div className="text-gray-700 text-xs">
              <span className="font-semibold">Customer:</span>
              <span className="ml-1">
                {results[0]?.customer_id}
              </span>
              {results[0]?.customer_name && (
                <>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="font-medium">{results[0]?.customer_name}</span>
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={exportToExcel}
            className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition duration-200 shadow-sm flex items-center gap-1"
            title="Export results to Excel"
          >
            📊 Export
          </button>
        </div>

        <div className="p-4">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="px-2 py-2 font-semibold text-gray-700 text-xs text-center w-8"></th>
                  {displayColumns.map((col, idx) => (
                    <th 
                      key={col} 
                      className={`px-3 py-2 font-semibold text-gray-700 text-xs ${
                        NUMERIC_COLUMNS.includes(col) ? 'text-right' : 'text-left'
                      } ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}
                    >
                      {formatColumnName(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    <tr 
                      className={`border-b border-gray-200 hover:bg-indigo-50 transition-colors ${
                        rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-2 py-2 text-center w-8">
                        <button
                          onClick={() => toggleRowExpanded(rowIdx)}
                          className={`text-indigo-600 hover:text-indigo-800 font-bold text-sm inline-flex items-center justify-center transition-transform ${
                            expandedRows[rowIdx] ? 'rotate-180' : 'rotate-90'
                          }`}
                          title={expandedRows[rowIdx] ? 'Collapse' : 'Expand'}
                        >
                          ∧
                        </button>
                      </td>
                      {displayColumns.map((col) => (
                        <td 
                          key={col} 
                          className={`px-3 py-2 text-gray-900 text-xs ${
                            NUMERIC_COLUMNS.includes(col) ? 'text-right font-mono' : ''
                          }`}
                        >
                          {formatValue(row[col], col)}
                        </td>
                      ))}
                    </tr>
                    {expandedRows[rowIdx] && (
                      <tr className={`border-b border-gray-200 ${rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td colSpan={displayColumns.length + 1} className="px-4 py-3">
                          <div className="bg-indigo-50 rounded p-3 border border-indigo-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">📋 Additional Details</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {DETAIL_COLUMNS.map((col) => (
                                <div key={col} className="text-xs">
                                  <span className="font-semibold text-gray-600">{formatColumnName(col)}:</span>
                                  <div className="text-gray-900 ml-2 mt-0.5 break-words">
                                    {formatValue(row[col], col)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSV view */}
      <details className="bg-white rounded-lg shadow p-3">
        <summary className="cursor-pointer font-semibold text-xs text-gray-700 hover:text-gray-900 flex items-center">
          <span className="mr-2">📋</span>
          View as CSV (Copy & Paste to Excel)
        </summary>
        <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded overflow-auto text-xs font-mono whitespace-pre-wrap break-words">
          {generateCSV()}
        </pre>
      </details>
    </div>
  )
}

export default ResultsDisplay
