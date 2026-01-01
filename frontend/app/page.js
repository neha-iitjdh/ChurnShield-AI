'use client'

/**
 * ChurnShield AI - Frontend v2.0
 *
 * Updated with all 13 features for better predictions!
 * Now organized into sections for better UX.
 */

import { useState, useEffect } from 'react'

const API_URL = 'https://churnshield-ai.onrender.com'

export default function Home() {
  // Form data with all 13 features
  const [formData, setFormData] = useState({
    // Demographics
    gender: 'Male',
    SeniorCitizen: 0,
    Partner: 'No',
    Dependents: 'No',
    // Account
    tenure: 12,
    Contract: 'Month-to-month',
    PaperlessBilling: 'Yes',
    PaymentMethod: 'Electronic check',
    // Services
    InternetService: 'Fiber optic',
    OnlineSecurity: 'No',
    TechSupport: 'No',
    // Charges
    MonthlyCharges: 75.50,
    TotalCharges: 906.00
  })

  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metrics, setMetrics] = useState(null)

  // Fetch model metrics on load
  useEffect(() => {
    fetch(`${API_URL}/metrics`)
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.log('Could not fetch metrics'))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['tenure', 'MonthlyCharges', 'TotalCharges', 'SeniorCitizen'].includes(name)
        ? parseFloat(value)
        : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPrediction(null)

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Prediction failed')

      const result = await response.json()
      setPrediction(result)
    } catch (err) {
      setError('Failed to get prediction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ChurnShield AI</h1>
      <p style={styles.subtitle}>Predict customer churn with XGBoost ML</p>

      {/* Model Accuracy Badge */}
      {metrics && metrics.accuracy && (
        <div style={styles.badge}>
          Model Accuracy: {metrics.accuracy}%
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Section: Demographics */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Customer Demographics</h3>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} style={styles.input}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Senior Citizen</label>
              <select name="SeniorCitizen" value={formData.SeniorCitizen} onChange={handleChange} style={styles.input}>
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Has Partner</label>
              <select name="Partner" value={formData.Partner} onChange={handleChange} style={styles.input}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Has Dependents</label>
              <select name="Dependents" value={formData.Dependents} onChange={handleChange} style={styles.input}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Account Info */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Account Information</h3>

          <div style={styles.field}>
            <label style={styles.label}>Tenure (months)</label>
            <input
              type="number"
              name="tenure"
              value={formData.tenure}
              onChange={handleChange}
              style={styles.input}
              min="0"
              max="72"
              required
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Contract Type</label>
              <select name="Contract" value={formData.Contract} onChange={handleChange} style={styles.input}>
                <option value="Month-to-month">Month-to-month</option>
                <option value="One year">One year</option>
                <option value="Two year">Two year</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Paperless Billing</label>
              <select name="PaperlessBilling" value={formData.PaperlessBilling} onChange={handleChange} style={styles.input}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Payment Method</label>
            <select name="PaymentMethod" value={formData.PaymentMethod} onChange={handleChange} style={styles.input}>
              <option value="Electronic check">Electronic check</option>
              <option value="Mailed check">Mailed check</option>
              <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
              <option value="Credit card (automatic)">Credit card (automatic)</option>
            </select>
          </div>
        </div>

        {/* Section: Services */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Services</h3>

          <div style={styles.field}>
            <label style={styles.label}>Internet Service</label>
            <select name="InternetService" value={formData.InternetService} onChange={handleChange} style={styles.input}>
              <option value="DSL">DSL</option>
              <option value="Fiber optic">Fiber optic</option>
              <option value="No">No internet</option>
            </select>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Online Security</label>
              <select name="OnlineSecurity" value={formData.OnlineSecurity} onChange={handleChange} style={styles.input}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="No internet service">No internet</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Tech Support</label>
              <select name="TechSupport" value={formData.TechSupport} onChange={handleChange} style={styles.input}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="No internet service">No internet</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Charges */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Charges</h3>

          <div style={styles.row}>
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
          </div>
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Churn Risk'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {/* Prediction Result */}
      {prediction && (
        <div style={{...styles.result, borderColor: getRiskColor(prediction.risk_level)}}>
          <h2 style={styles.resultTitle}>Prediction Result</h2>

          <div style={styles.probabilityBar}>
            <div
              style={{
                ...styles.probabilityFill,
                width: `${prediction.churn_probability}%`,
                backgroundColor: getRiskColor(prediction.risk_level)
              }}
            />
          </div>

          <div style={styles.resultItem}>
            <span>Churn Probability:</span>
            <strong style={{ color: getRiskColor(prediction.risk_level), fontSize: '1.5rem' }}>
              {prediction.churn_probability}%
            </strong>
          </div>

          <div style={styles.resultItem}>
            <span>Risk Level:</span>
            <strong style={{
              color: 'white',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: getRiskColor(prediction.risk_level)
            }}>
              {prediction.risk_level}
            </strong>
          </div>

          <div style={styles.resultItem}>
            <span>Prediction:</span>
            <strong style={{ color: prediction.will_churn ? '#dc2626' : '#22c55e' }}>
              {prediction.will_churn ? 'Likely to Churn' : 'Likely to Stay'}
            </strong>
          </div>
        </div>
      )}

      {/* Footer */}
      <p style={styles.footer}>
        Powered by XGBoost • 13 Features • {metrics ? `${metrics.total_samples} Training Samples` : 'Loading...'}
      </p>
    </div>
  )
}

function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case 'Low': return '#22c55e'
    case 'Medium': return '#f59e0b'
    case 'High': return '#ef4444'
    case 'Critical': return '#dc2626'
    default: return '#6b7280'
  }
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    fontSize: '2rem',
    textAlign: 'center',
    marginBottom: '4px',
    color: '#1f2937',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '16px',
  },
  badge: {
    textAlign: 'center',
    padding: '8px 16px',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '24px',
    display: 'inline-block',
    width: '100%',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#4b5563',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: 'white',
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
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
    borderRadius: '12px',
    backgroundColor: 'white',
  },
  resultTitle: {
    fontSize: '1.25rem',
    marginBottom: '16px',
    color: '#1f2937',
  },
  probabilityBar: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  probabilityFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  footer: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '12px',
    marginTop: '32px',
  },
}
