'use client'

/**
 * Main Page - Churn Prediction Form
 *
 * What this does:
 * 1. Shows a form to enter customer data
 * 2. Sends data to our FastAPI backend
 * 3. Displays the churn prediction result
 */

import { useState } from 'react'

// Your Render backend URL
const API_URL = 'https://churnshield-ai.onrender.com'

export default function Home() {
  // ============================================================
  // State: Data that changes over time
  // ============================================================

  // Form inputs
  const [formData, setFormData] = useState({
    tenure: 12,
    MonthlyCharges: 65.50,
    TotalCharges: 786.00,
    Contract: 'Month-to-month',
    PaymentMethod: 'Electronic check'
  })

  // Prediction result from API
  const [prediction, setPrediction] = useState(null)

  // Loading state (while waiting for API)
  const [loading, setLoading] = useState(false)

  // Error message
  const [error, setError] = useState(null)

  // ============================================================
  // Handle form input changes
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      // Convert to number for numeric fields
      [name]: ['tenure', 'MonthlyCharges', 'TotalCharges'].includes(name)
        ? parseFloat(value)
        : value
    }))
  }

  // ============================================================
  // Handle form submission
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault()  // Prevent page reload
    setLoading(true)
    setError(null)
    setPrediction(null)

    try {
      // Send POST request to our API
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Prediction failed')
      }

      const result = await response.json()
      setPrediction(result)
    } catch (err) {
      setError('Failed to get prediction. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // Render the UI
  // ============================================================
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ChurnShield AI</h1>
      <p style={styles.subtitle}>Predict customer churn with machine learning</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Tenure */}
        <div style={styles.field}>
          <label style={styles.label}>Tenure (months)</label>
          <input
            type="number"
            name="tenure"
            value={formData.tenure}
            onChange={handleChange}
            style={styles.input}
            min="0"
            required
          />
        </div>

        {/* Monthly Charges */}
        <div style={styles.field}>
          <label style={styles.label}>Monthly Charges ($)</label>
          <input
            type="number"
            name="MonthlyCharges"
            value={formData.MonthlyCharges}
            onChange={handleChange}
            style={styles.input}
            step="0.01"
            min="0"
            required
          />
        </div>

        {/* Total Charges */}
        <div style={styles.field}>
          <label style={styles.label}>Total Charges ($)</label>
          <input
            type="number"
            name="TotalCharges"
            value={formData.TotalCharges}
            onChange={handleChange}
            style={styles.input}
            step="0.01"
            min="0"
            required
          />
        </div>

        {/* Contract Type */}
        <div style={styles.field}>
          <label style={styles.label}>Contract Type</label>
          <select
            name="Contract"
            value={formData.Contract}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="Month-to-month">Month-to-month</option>
            <option value="One year">One year</option>
            <option value="Two year">Two year</option>
          </select>
        </div>

        {/* Payment Method */}
        <div style={styles.field}>
          <label style={styles.label}>Payment Method</label>
          <select
            name="PaymentMethod"
            value={formData.PaymentMethod}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="Electronic check">Electronic check</option>
            <option value="Mailed check">Mailed check</option>
            <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
            <option value="Credit card (automatic)">Credit card (automatic)</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          style={styles.button}
          disabled={loading}
        >
          {loading ? 'Predicting...' : 'Predict Churn'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {/* Prediction Result */}
      {prediction && (
        <div style={{
          ...styles.result,
          borderColor: getRiskColor(prediction.risk_level)
        }}>
          <h2 style={styles.resultTitle}>Prediction Result</h2>

          <div style={styles.resultItem}>
            <span>Churn Probability:</span>
            <strong style={{ color: getRiskColor(prediction.risk_level) }}>
              {prediction.churn_probability}%
            </strong>
          </div>

          <div style={styles.resultItem}>
            <span>Risk Level:</span>
            <strong style={{
              color: getRiskColor(prediction.risk_level),
              padding: '4px 12px',
              borderRadius: '4px',
              backgroundColor: getRiskColor(prediction.risk_level) + '20'
            }}>
              {prediction.risk_level}
            </strong>
          </div>

          <div style={styles.resultItem}>
            <span>Will Churn:</span>
            <strong>{prediction.will_churn ? 'Yes' : 'No'}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Helper: Get color based on risk level
// ============================================================
function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case 'Low': return '#22c55e'      // Green
    case 'Medium': return '#f59e0b'   // Orange
    case 'High': return '#ef4444'     // Red
    case 'Critical': return '#dc2626' // Dark Red
    default: return '#6b7280'         // Gray
  }
}

// ============================================================
// Styles (inline CSS)
// ============================================================
const styles = {
  container: {
    maxWidth: '500px',
    margin: '40px auto',
    padding: '20px',
  },
  title: {
    fontSize: '2rem',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#1f2937',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    textAlign: 'center',
  },
  result: {
    marginTop: '24px',
    padding: '20px',
    border: '2px solid',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  resultTitle: {
    fontSize: '1.25rem',
    marginBottom: '16px',
    color: '#1f2937',
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
  },
}
