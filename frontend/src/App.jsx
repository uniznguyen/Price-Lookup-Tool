import React, { useState, useEffect } from 'react'
import axios from 'axios'
import PriceQueryForm from './components/PriceQueryForm'
import ResultsDisplay from './components/ResultsDisplay'
import './index.css'

function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('🚀 Price Inquiry App Initialized')
    // Test health check on mount
    testHealthCheck()
  }, [])

  const testHealthCheck = async () => {
    try {
      console.log('💚 Testing backend health...')
      const response = await axios.get('/api/health')
      console.log('✅ Backend health check passed:', response.data)
    } catch (err) {
      console.error('❌ Backend health check failed:', err)
    }
  }

  const handleQuerySubmit = async (formData) => {
    console.log('🔍 Batch Price Query Submission Started')
    
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      console.log('📋 Form Data:', formData)
      
      // Build batch request with all items
      const batchRequest = {
        customer_id: formData.customerId,
        items: formData.items.map(item => ({
          item_id: item.itemId,
          location_id: item.locationId,
          qty: parseFloat(item.quantity)
        }))
      }
      
      console.log('📤 Sending batch request to /api/query-price-batch')
      console.log(`   Items: ${batchRequest.items.length}`)
      console.log('   Payload:', batchRequest)

      const response = await axios.post('/api/query-price-batch', batchRequest, {
        timeout: 60000  // 60 second timeout for batch queries
      })

      console.log('✅ Batch response received successfully')
      console.log('   Status:', response.status)
      console.log('   Items processed:', response.data.items_processed)
      console.log('   Total results:', response.data.count)

      setResults(response.data)
      console.log(`✓ Successfully retrieved ${response.data.count} total result(s) from ${response.data.items_processed} item(s)`)
    } catch (err) {
      let errorMessage = err.response?.data?.error || err.message || 'Failed to query prices. Please try again.'
      
      // Check if there are invalid items from validation
      if (err.response?.data?.invalid_items && err.response.data.invalid_items.length > 0) {
        const invalidList = err.response.data.invalid_items
          .map(item => `[Item ${item.index}] ${item.item_id}: ${item.error}`)
          .join('\n')
        errorMessage = `${errorMessage}\n\nInvalid Items:\n${invalidList}`
      }
      
      console.error('❌ Error during batch query:', errorMessage)
      console.error('   Full error:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-50">
      <div className="w-full">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-full mx-auto py-3 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Price Inquiry</h1>
            <p className="text-gray-600 text-xs mt-1">Query product pricing information</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Form Section - Top */}
          <div className="mb-4">
            <PriceQueryForm onSubmit={handleQuerySubmit} isLoading={loading} />
          </div>

          {/* Results Section - Below */}
          <div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold">❌ Error</p>
                  <p className="text-red-700 whitespace-pre-wrap">{error}</p>
                </div>
              )}

              {loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
                    <p className="text-blue-800 font-semibold">Querying pricing information...</p>
                  </div>
                </div>
              )}

              {results && !loading && <ResultsDisplay data={results} />}

              {!results && !loading && !error && (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center min-h-96 flex items-center justify-center">
                  <div>
                    <p className="text-gray-500 text-lg">📊 Submit a query to view results</p>
                    <p className="text-gray-400 text-sm mt-2">Fill in the parameters above and click "Query Price"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  )
}

export default App
