'use client'

/**
 * ChurnShield AI - Frontend v2.2
 *
 * Features:
 * - Single customer prediction with 13 features
 * - Batch CSV upload with visualizations
 * - Feature importance chart
 * - Risk distribution chart
 * - Prediction history with stats (NEW!)
 */

import { useState, useEffect } from 'react'

const API_URL = 'https://churnshield-ai.onrender.com'

export default function Home() {
  // Tab state
  const [activeTab, setActiveTab] = useState('single')

  // Single prediction state
  const [formData, setFormData] = useState({
    gender: 'Male',
    SeniorCitizen: 0,
    Partner: 'No',
    Dependents: 'No',
    tenure: 12,
    Contract: 'Month-to-month',
    PaperlessBilling: 'Yes',
    PaymentMethod: 'Electronic check',
    InternetService: 'Fiber optic',
    OnlineSecurity: 'No',
    TechSupport: 'No',
    MonthlyCharges: 75.50,
    TotalCharges: 906.00
  })

  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metrics, setMetrics] = useState(null)

  // Batch prediction state
  const [batchFile, setBatchFile] = useState(null)
  const [batchResults, setBatchResults] = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)

  // History state
  const [history, setHistory] = useState([])
  const [historyStats, setHistoryStats] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Fetch metrics on load
  useEffect(() => {
    fetch(`${API_URL}/metrics`)
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(() => console.log('Could not fetch metrics'))
  }, [])

  // Fetch history when tab changes to history
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
      fetchHistoryStats()
    }
  }, [activeTab])

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await fetch(`${API_URL}/history?limit=20`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.predictions || [])
      }
    } catch (err) {
      console.log('Could not fetch history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchHistoryStats = async () => {
    try {
      const response = await fetch(`${API_URL}/history/stats`)
      if (response.ok) {
        const data = await response.json()
        setHistoryStats(data)
      }
    } catch (err) {
      console.log('Could not fetch history stats')
    }
  }

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
    } catch {
      setError('Failed to get prediction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchUpload = async (e) => {
    e.preventDefault()
    if (!batchFile) return

    setBatchLoading(true)
    setBatchResults(null)
    setError(null)

    const formData = new FormData()
    formData.append('file', batchFile)

    try {
      const response = await fetch(`${API_URL}/predict/batch`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Batch prediction failed')
      }
      const result = await response.json()
      setBatchResults(result)
    } catch (err) {
      setError(err.message || 'Batch prediction failed')
    } finally {
      setBatchLoading(false)
    }
  }

  const handleDeleteHistory = async (id) => {
    try {
      const response = await fetch(`${API_URL}/history/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setHistory(prev => prev.filter(p => p.id !== id))
        fetchHistoryStats()
      }
    } catch (err) {
      console.log('Could not delete')
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return
    try {
      const response = await fetch(`${API_URL}/history`, { method: 'DELETE' })
      if (response.ok) {
        setHistory([])
        setHistoryStats(null)
      }
    } catch (err) {
      console.log('Could not clear history')
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ChurnShield AI</h1>
      <p style={styles.subtitle}>Predict customer churn with XGBoost ML</p>

      {/* Model Stats */}
      {metrics && metrics.accuracy && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{metrics.accuracy}%</div>
            <div style={styles.statLabel}>Model Accuracy</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{metrics.total_samples?.toLocaleString()}</div>
            <div style={styles.statLabel}>Training Samples</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>13</div>
            <div style={styles.statLabel}>Features</div>
          </div>
        </div>
      )}

      {/* Feature Importance Chart */}
      {metrics && metrics.feature_importance && (
        <div style={styles.chartSection}>
          <h3 style={styles.chartTitle}>Feature Importance - What Drives Churn?</h3>
          <div style={styles.chartContainer}>
            {Object.entries(metrics.feature_importance)
              .slice(0, 6)
              .map(([feature, importance]) => (
                <div key={feature} style={styles.barRow}>
                  <div style={styles.barLabel}>{feature}</div>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${Math.min(importance, 100)}%`,
                        backgroundColor: importance > 20 ? '#ef4444' : importance > 10 ? '#f59e0b' : '#3b82f6'
                      }}
                    />
                  </div>
                  <div style={styles.barValue}>{importance}%</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'single' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('single')}
        >
          Single Prediction
        </button>
        <button
          style={activeTab === 'batch' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('batch')}
        >
          Batch Upload (CSV)
        </button>
        <button
          style={activeTab === 'history' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* Error Display */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Single Prediction Tab */}
      {activeTab === 'single' && (
        <>
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Demographics Section */}
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

            {/* Account Section */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Account Information</h3>
              <div style={styles.field}>
                <label style={styles.label}>Tenure (months)</label>
                <input type="number" name="tenure" value={formData.tenure} onChange={handleChange} style={styles.input} min="0" max="72" required />
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

            {/* Services Section */}
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

            {/* Charges Section */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Charges</h3>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Monthly Charges ($)</label>
                  <input type="number" name="MonthlyCharges" value={formData.MonthlyCharges} onChange={handleChange} style={styles.input} step="0.01" min="0" required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Total Charges ($)</label>
                  <input type="number" name="TotalCharges" value={formData.TotalCharges} onChange={handleChange} style={styles.input} step="0.01" min="0" required />
                </div>
              </div>
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Predicting...' : 'Predict Churn Risk'}
            </button>
          </form>

          {/* Single Prediction Result */}
          {prediction && (
            <div style={{...styles.result, borderColor: getRiskColor(prediction.risk_level)}}>
              <h2 style={styles.resultTitle}>Prediction Result</h2>
              <div style={styles.probabilityBar}>
                <div style={{...styles.probabilityFill, width: `${prediction.churn_probability}%`, backgroundColor: getRiskColor(prediction.risk_level)}} />
              </div>
              <div style={styles.resultGrid}>
                <div style={styles.resultCard}>
                  <div style={{...styles.resultValue, color: getRiskColor(prediction.risk_level)}}>{prediction.churn_probability}%</div>
                  <div style={styles.resultLabel}>Churn Probability</div>
                </div>
                <div style={styles.resultCard}>
                  <div style={{...styles.riskBadge, backgroundColor: getRiskColor(prediction.risk_level)}}>{prediction.risk_level}</div>
                  <div style={styles.resultLabel}>Risk Level</div>
                </div>
                <div style={styles.resultCard}>
                  <div style={{...styles.resultValue, color: prediction.will_churn ? '#dc2626' : '#22c55e'}}>{prediction.will_churn ? 'Yes' : 'No'}</div>
                  <div style={styles.resultLabel}>Will Churn?</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Batch Upload Tab */}
      {activeTab === 'batch' && (
        <>
          <div style={styles.batchSection}>
            <h3 style={styles.sectionTitle}>Upload Customer CSV</h3>
            <p style={styles.helpText}>
              Upload a CSV file with columns: tenure, Contract, PaymentMethod, MonthlyCharges, TotalCharges
              <br />Optional: customerID, gender, SeniorCitizen, Partner, Dependents, etc.
            </p>
            <form onSubmit={handleBatchUpload} style={styles.uploadForm}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBatchFile(e.target.files[0])}
                style={styles.fileInput}
              />
              <button type="submit" style={styles.button} disabled={batchLoading || !batchFile}>
                {batchLoading ? 'Processing...' : 'Analyze Customers'}
              </button>
            </form>
          </div>

          {/* Batch Results */}
          {batchResults && (
            <div style={styles.batchResults}>
              <h3 style={styles.resultTitle}>Batch Analysis Results</h3>

              {/* Summary Cards */}
              <div style={styles.summaryGrid}>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryValue}>{batchResults.summary.total_customers}</div>
                  <div style={styles.summaryLabel}>Total Customers</div>
                </div>
                <div style={{...styles.summaryCard, borderColor: '#dc2626'}}>
                  <div style={{...styles.summaryValue, color: '#dc2626'}}>{batchResults.summary.predicted_churners}</div>
                  <div style={styles.summaryLabel}>Predicted Churners</div>
                </div>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryValue}>{batchResults.summary.churn_rate}%</div>
                  <div style={styles.summaryLabel}>Churn Rate</div>
                </div>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryValue}>{batchResults.summary.average_churn_probability}%</div>
                  <div style={styles.summaryLabel}>Avg Probability</div>
                </div>
              </div>

              {/* Risk Distribution */}
              <div style={styles.riskDistribution}>
                <h4 style={styles.chartTitle}>Risk Distribution</h4>
                <div style={styles.riskBars}>
                  {Object.entries(batchResults.summary.risk_distribution).map(([level, count]) => (
                    <div key={level} style={styles.riskBarItem}>
                      <div style={styles.riskBarLabel}>{level}</div>
                      <div style={styles.riskBarTrack}>
                        <div style={{
                          ...styles.riskBarFill,
                          width: `${(count / batchResults.total_customers) * 100}%`,
                          backgroundColor: getRiskColor(level)
                        }} />
                      </div>
                      <div style={styles.riskBarCount}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Table */}
              <div style={styles.tableContainer}>
                <h4 style={styles.chartTitle}>Individual Predictions</h4>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Customer ID</th>
                      <th style={styles.th}>Probability</th>
                      <th style={styles.th}>Risk Level</th>
                      <th style={styles.th}>Will Churn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.predictions.map((pred, idx) => (
                      <tr key={idx} style={pred.will_churn ? styles.trChurn : styles.tr}>
                        <td style={styles.td}>{pred.customer_id}</td>
                        <td style={styles.td}>{pred.churn_probability}%</td>
                        <td style={styles.td}>
                          <span style={{...styles.tableBadge, backgroundColor: getRiskColor(pred.risk_level)}}>
                            {pred.risk_level}
                          </span>
                        </td>
                        <td style={{...styles.td, color: pred.will_churn ? '#dc2626' : '#22c55e', fontWeight: '600'}}>
                          {pred.will_churn ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <>
          {/* History Stats */}
          {historyStats && historyStats.total_predictions > 0 && (
            <div style={styles.historyStats}>
              <div style={styles.summaryGrid}>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryValue}>{historyStats.total_predictions}</div>
                  <div style={styles.summaryLabel}>Total Predictions</div>
                </div>
                <div style={{...styles.summaryCard, borderColor: '#dc2626'}}>
                  <div style={{...styles.summaryValue, color: '#dc2626'}}>{historyStats.overall_churn_rate}%</div>
                  <div style={styles.summaryLabel}>Churn Rate</div>
                </div>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryValue}>{historyStats.average_probability}%</div>
                  <div style={styles.summaryLabel}>Avg Probability</div>
                </div>
                <div style={styles.summaryCard}>
                  <button onClick={handleClearHistory} style={styles.clearButton}>
                    Clear All
                  </button>
                </div>
              </div>

              {/* Risk Distribution */}
              {historyStats.risk_distribution && Object.keys(historyStats.risk_distribution).length > 0 && (
                <div style={styles.riskDistribution}>
                  <h4 style={styles.chartTitle}>Historical Risk Distribution</h4>
                  <div style={styles.riskBars}>
                    {Object.entries(historyStats.risk_distribution).map(([level, count]) => (
                      <div key={level} style={styles.riskBarItem}>
                        <div style={styles.riskBarLabel}>{level}</div>
                        <div style={styles.riskBarTrack}>
                          <div style={{
                            ...styles.riskBarFill,
                            width: `${(count / historyStats.total_predictions) * 100}%`,
                            backgroundColor: getRiskColor(level)
                          }} />
                        </div>
                        <div style={styles.riskBarCount}>{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Table */}
          <div style={styles.tableContainer}>
            <h4 style={styles.chartTitle}>Recent Predictions</h4>
            {historyLoading ? (
              <div style={styles.loading}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No predictions yet. Make some predictions to see them here!</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Probability</th>
                    <th style={styles.th}>Risk</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((pred) => (
                    <tr key={pred.id} style={pred.will_churn ? styles.trChurn : styles.tr}>
                      <td style={styles.td}>{new Date(pred.created_at).toLocaleString()}</td>
                      <td style={styles.td}>
                        <span style={{...styles.typeBadge, backgroundColor: pred.prediction_type === 'batch' ? '#8b5cf6' : '#3b82f6'}}>
                          {pred.prediction_type}
                        </span>
                      </td>
                      <td style={styles.td}>{pred.churn_probability}%</td>
                      <td style={styles.td}>
                        <span style={{...styles.tableBadge, backgroundColor: getRiskColor(pred.risk_level)}}>
                          {pred.risk_level}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => handleDeleteHistory(pred.id)} style={styles.deleteButton}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <p style={styles.footer}>
        ChurnShield AI v2.2 • XGBoost • {metrics ? `${metrics.total_samples?.toLocaleString()} samples` : ''}
      </p>
    </div>
  )
}

function getRiskColor(level) {
  const colors = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' }
  return colors[level] || '#6b7280'
}

const styles = {
  container: { maxWidth: '700px', margin: '40px auto', padding: '20px', fontFamily: 'system-ui, sans-serif' },
  title: { fontSize: '2rem', textAlign: 'center', marginBottom: '4px', color: '#1f2937' },
  subtitle: { textAlign: 'center', color: '#6b7280', marginBottom: '24px' },

  // Stats
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' },
  statCard: { padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '12px', textAlign: 'center', border: '1px solid #bbf7d0' },
  statValue: { fontSize: '1.5rem', fontWeight: '700', color: '#166534' },
  statLabel: { fontSize: '12px', color: '#4b5563', marginTop: '4px' },

  // Feature Chart
  chartSection: { padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e5e7eb' },
  chartTitle: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' },
  chartContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  barRow: { display: 'grid', gridTemplateColumns: '120px 1fr 50px', gap: '12px', alignItems: 'center' },
  barLabel: { fontSize: '12px', color: '#4b5563', textAlign: 'right' },
  barTrack: { height: '20px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '4px', transition: 'width 0.5s' },
  barValue: { fontSize: '12px', fontWeight: '600', color: '#374151' },

  // Tabs
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: { flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500', color: '#6b7280' },
  tabActive: { flex: 1, padding: '12px', border: '2px solid #3b82f6', borderRadius: '8px', backgroundColor: '#eff6ff', cursor: 'pointer', fontWeight: '600', color: '#3b82f6' },

  // Form
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  section: { padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' },
  sectionTitle: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' },
  label: { fontSize: '12px', fontWeight: '500', color: '#4b5563' },
  input: { padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white' },
  button: { padding: '14px', fontSize: '16px', fontWeight: '600', color: 'white', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  error: { padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', textAlign: 'center', marginBottom: '16px' },

  // Results
  result: { marginTop: '24px', padding: '20px', border: '2px solid', borderRadius: '12px', backgroundColor: 'white' },
  resultTitle: { fontSize: '1.1rem', marginBottom: '16px', color: '#1f2937', fontWeight: '600' },
  probabilityBar: { height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '20px', overflow: 'hidden' },
  probabilityFill: { height: '100%', borderRadius: '4px', transition: 'width 0.5s' },
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  resultCard: { textAlign: 'center', padding: '12px' },
  resultValue: { fontSize: '1.5rem', fontWeight: '700' },
  resultLabel: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  riskBadge: { display: 'inline-block', padding: '8px 16px', borderRadius: '20px', color: 'white', fontWeight: '600', fontSize: '14px' },

  // Batch
  batchSection: { padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' },
  helpText: { fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' },
  uploadForm: { display: 'flex', gap: '12px', alignItems: 'center' },
  fileInput: { flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white' },
  batchResults: { marginTop: '24px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
  summaryCard: { padding: '16px', backgroundColor: 'white', borderRadius: '12px', textAlign: 'center', border: '2px solid #e5e7eb' },
  summaryValue: { fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' },
  summaryLabel: { fontSize: '11px', color: '#6b7280', marginTop: '4px', textTransform: 'uppercase' },

  // Risk Distribution
  riskDistribution: { padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' },
  riskBars: { display: 'flex', flexDirection: 'column', gap: '12px' },
  riskBarItem: { display: 'grid', gridTemplateColumns: '70px 1fr 40px', gap: '12px', alignItems: 'center' },
  riskBarLabel: { fontSize: '13px', fontWeight: '500' },
  riskBarTrack: { height: '24px', backgroundColor: '#f3f4f6', borderRadius: '6px', overflow: 'hidden' },
  riskBarFill: { height: '100%', borderRadius: '6px', transition: 'width 0.3s' },
  riskBarCount: { fontSize: '14px', fontWeight: '600', textAlign: 'right' },

  // Table
  tableContainer: { backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '12px 16px', backgroundColor: '#f9fafb', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  trChurn: { borderBottom: '1px solid #f3f4f6', backgroundColor: '#fef2f2' },
  td: { padding: '12px 16px' },
  tableBadge: { padding: '4px 10px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: '500' },
  typeBadge: { padding: '4px 10px', borderRadius: '12px', color: 'white', fontSize: '11px', fontWeight: '500' },

  // History
  historyStats: { marginBottom: '24px' },
  loading: { padding: '40px', textAlign: 'center', color: '#6b7280' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#6b7280' },
  clearButton: { padding: '10px 16px', fontSize: '13px', fontWeight: '600', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer' },
  deleteButton: { padding: '6px 12px', fontSize: '12px', color: '#dc2626', backgroundColor: 'transparent', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' },

  footer: { textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '32px' },
}
