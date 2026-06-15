import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

function PriceQueryForm({ onSubmit, isLoading }) {
  const [customerId, setCustomerId] = useState('102572')
  const [items, setItems] = useState([
    { id: uuidv4(), itemId: 'BF11019', quantity: '1', locationId: '100001' }
  ])

  const handleCustomerIdChange = (e) => {
    const value = e.target.value
    console.log(`📝 Customer ID changed: ${value}`)
    setCustomerId(value)
  }

  const handleItemChange = (index, field, value) => {
    console.log(`📝 Item ${index} ${field} changed: ${value}`)
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleAddItem = () => {
    console.log('➕ Adding new item row')
    setItems([...items, { id: uuidv4(), itemId: '', quantity: '1', locationId: '100001' }])
  }

  const handleRemoveItem = (index) => {
    console.log(`➖ Removing item row ${index}`)
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    console.log('📋 Form submission initiated')
    console.log('   Customer ID:', customerId)
    console.log('   Items:', items)
    
    // Validate fields
    if (!customerId) {
      console.warn('⚠️  Validation failed - missing customer ID')
      alert('Please enter customer ID')
      return
    }

    if (items.length === 0) {
      console.warn('⚠️  Validation failed - no items')
      alert('Please add at least one item')
      return
    }

    const allItemsValid = items.every(item => item.itemId && item.quantity && item.locationId)
    if (!allItemsValid) {
      console.warn('⚠️  Validation failed - missing required fields in items')
      alert('Please fill in all fields for each item')
      return
    }
    
    console.log('✓ Form validation passed')
    onSubmit({ customerId, items })
  }

  const handleReset = () => {
    console.log('🔄 Form reset initiated')
    setCustomerId('102572')
    setItems([{ id: uuidv4(), itemId: 'BF11019', quantity: '1', locationId: '100001' }])
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2">
        <h2 className="text-sm font-semibold text-white">🔍 Query Parameters</h2>
        <p className="text-blue-100 text-xs mt-0.5">📝 Multi-item pricing lookup</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {/* Customer ID */}
        <div>
          <label htmlFor="customerId" className="block text-xs font-medium text-gray-700 mb-1">
            Customer ID
          </label>
          <input
            type="text"
            id="customerId"
            value={customerId}
            onChange={handleCustomerIdChange}
            placeholder="Enter customer ID"
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
            disabled={isLoading}
          />
        </div>

        {/* Items Section */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={handleAddItem}
              disabled={isLoading}
              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 transition"
            >
              + Add Item
            </button>
            <label className="block text-xs font-medium text-gray-700">Items</label>
          </div>

          <div className="space-y-2">
            {/* Header row for items */}
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700">Item ID</label>
              </div>
              <div className="w-16">
                <label className="block text-xs font-medium text-gray-700">Quantity</label>
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-gray-700">Location</label>
              </div>
              {items.length > 1 && (
                <div className="w-8"></div>
              )}
            </div>

            {/* Item input rows */}
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-2">
                <input
                  type="text"
                  value={item.itemId}
                  onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                  placeholder="Item ID"
                  className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-xs"
                  disabled={isLoading}
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  placeholder="Qty"
                  min="1"
                  step="0.01"
                  className="w-16 px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-xs"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  value={item.locationId}
                  onChange={(e) => handleItemChange(index, 'locationId', e.target.value)}
                  placeholder="Loc"
                  className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-xs"
                  disabled={isLoading}
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={isLoading}
                    className="bg-red-100 text-red-700 px-2 py-1.5 rounded-md hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 transition text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit and Reset Buttons */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium text-sm py-1.5 px-3 rounded-md hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition duration-200 shadow-sm"
        >
          {isLoading ? '⏳ Querying...' : '🔍 Query Price'}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading}
          className="w-full bg-gray-200 text-gray-700 font-medium text-sm py-1.5 px-3 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-200"
        >
          ↻ Reset
        </button>
      </form>
    </div>
  )
}

export default PriceQueryForm
