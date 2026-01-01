'use client'

/**
 * ChurnShield AI - Frontend v2.4
 *
 * Features:
 * - Single customer prediction with 13 features
 * - Batch CSV upload with visualizations
 * - Feature importance chart
 * - Churn risk gauge
 * - Risk factor breakdown
 * - Retention recommendations
 * - What-if comparison mode
 * - Customer segments
 * - Prediction history with stats
 * - Dashboard Analytics (NEW!)
 * - Trend charts & KPIs (NEW!)
 */

import { useState, useEffect } from 'react'

const API_URL = 'https://churnshield-ai.onrender.com'

// Risk factor analysis based on input values
function analyzeRiskFactors(formData) {
  const factors = []

  // Tenure analysis
  if (formData.tenure <= 6) {
    factors.push({ factor: 'Very short tenure', impact: 'high', description: 'New customers (< 6 months) have highest churn risk' })
  } else if (formData.tenure <= 12) {
    factors.push({ factor: 'Short tenure', impact: 'medium', description: 'Customers under 1 year are still at risk' })
  } else if (formData.tenure >= 48) {
    factors.push({ factor: 'Long tenure', impact: 'positive', description: 'Loyal customers (4+ years) rarely churn' })
  }

  // Contract analysis
  if (formData.Contract === 'Month-to-month') {
    factors.push({ factor: 'Month-to-month contract', impact: 'high', description: 'No commitment makes switching easy' })
  } else if (formData.Contract === 'Two year') {
    factors.push({ factor: 'Two year contract', impact: 'positive', description: 'Long-term commitment reduces churn' })
  }

  // Payment method
  if (formData.PaymentMethod === 'Electronic check') {
    factors.push({ factor: 'Electronic check payment', impact: 'high', description: 'Electronic check users churn 2x more often' })
  } else if (formData.PaymentMethod.includes('automatic')) {
    factors.push({ factor: 'Automatic payment', impact: 'positive', description: 'Auto-pay reduces friction and churn' })
  }

  // Services
  if (formData.OnlineSecurity === 'No' && formData.InternetService !== 'No') {
    factors.push({ factor: 'No online security', impact: 'medium', description: 'Security add-ons increase stickiness' })
  }
  if (formData.TechSupport === 'No' && formData.InternetService !== 'No') {
    factors.push({ factor: 'No tech support', impact: 'medium', description: 'Support services reduce frustration' })
  }

  // Internet service
  if (formData.InternetService === 'Fiber optic') {
    factors.push({ factor: 'Fiber optic internet', impact: 'medium', description: 'Fiber customers have higher expectations' })
  }

  // Senior citizen
  if (formData.SeniorCitizen === 1) {
    factors.push({ factor: 'Senior citizen', impact: 'medium', description: 'Seniors may need extra support' })
  }

  // Monthly charges
  if (formData.MonthlyCharges > 80) {
    factors.push({ factor: 'High monthly charges', impact: 'medium', description: 'Customers paying $80+/month are price sensitive' })
  }

  // No partner/dependents
  if (formData.Partner === 'No' && formData.Dependents === 'No') {
    factors.push({ factor: 'Single household', impact: 'low', description: 'Less family ties to the service' })
  }

  return factors
}

// Generate retention recommendations based on risk factors
function getRetentionRecommendations(formData, riskLevel, factors) {
  const recommendations = []

  if (formData.Contract === 'Month-to-month') {
    recommendations.push({
      action: 'Offer contract upgrade',
      description: 'Provide 15% discount for switching to 1-year contract',
      priority: 'high',
      expectedImpact: '-20% churn risk'
    })
  }

  if (formData.PaymentMethod === 'Electronic check') {
    recommendations.push({
      action: 'Incentivize auto-pay',
      description: 'Offer $5/month credit for setting up automatic payments',
      priority: 'high',
      expectedImpact: '-15% churn risk'
    })
  }

  if (formData.OnlineSecurity === 'No' && formData.InternetService !== 'No') {
    recommendations.push({
      action: 'Free security trial',
      description: 'Offer 3-month free trial of Online Security service',
      priority: 'medium',
      expectedImpact: '-10% churn risk'
    })
  }

  if (formData.TechSupport === 'No' && formData.InternetService !== 'No') {
    recommendations.push({
      action: 'Add tech support',
      description: 'Include Tech Support free for first 6 months',
      priority: 'medium',
      expectedImpact: '-8% churn risk'
    })
  }

  if (formData.tenure <= 12) {
    recommendations.push({
      action: 'New customer onboarding',
      description: 'Schedule personal check-in call with customer success team',
      priority: 'high',
      expectedImpact: '-12% churn risk'
    })
  }

  if (riskLevel === 'Critical' || riskLevel === 'High') {
    recommendations.push({
      action: 'Loyalty discount',
      description: 'Offer exclusive 20% loyalty discount for 6 months',
      priority: 'critical',
      expectedImpact: '-25% churn risk'
    })
  }

  if (formData.MonthlyCharges > 80) {
    recommendations.push({
      action: 'Plan optimization review',
      description: 'Review plan to identify potential savings while keeping value',
      priority: 'medium',
      expectedImpact: '-5% churn risk'
    })
  }

  return recommendations.slice(0, 4) // Return top 4 recommendations
}

export default function Home() {
  // Tab state
  const [activeTab, setActiveTab] = useState('dashboard')

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
  const [riskFactors, setRiskFactors] = useState([])
  const [recommendations, setRecommendations] = useState([])

  // What-if comparison state
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonData, setComparisonData] = useState(null)
  const [comparisonPrediction, setComparisonPrediction] = useState(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)

  // Batch prediction state
  const [batchFile, setBatchFile] = useState(null)
  const [batchResults, setBatchResults] = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState('all')

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

  // Fetch history when tab changes to history or dashboard
  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'dashboard') {
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
    setRiskFactors([])
    setRecommendations([])

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Prediction failed')
      const result = await response.json()
      setPrediction(result)

      // Analyze risk factors
      const factors = analyzeRiskFactors(formData)
      setRiskFactors(factors)

      // Get recommendations
      const recs = getRetentionRecommendations(formData, result.risk_level, factors)
      setRecommendations(recs)

      // Setup comparison data
      setComparisonData({...formData})
      setShowComparison(false)
      setComparisonPrediction(null)
    } catch {
      setError('Failed to get prediction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComparisonChange = (e) => {
    const { name, value } = e.target
    setComparisonData(prev => ({
      ...prev,
      [name]: ['tenure', 'MonthlyCharges', 'TotalCharges', 'SeniorCitizen'].includes(name)
        ? parseFloat(value)
        : value
    }))
  }

  const runComparison = async () => {
    setComparisonLoading(true)
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comparisonData),
      })
      if (response.ok) {
        const result = await response.json()
        setComparisonPrediction(result)
      }
    } catch (err) {
      console.log('Comparison failed')
    } finally {
      setComparisonLoading(false)
    }
  }

  const handleBatchUpload = async (e) => {
    e.preventDefault()
    if (!batchFile) return

    setBatchLoading(true)
    setBatchResults(null)
    setError(null)

    const formDataUpload = new FormData()
    formDataUpload.append('file', batchFile)

    try {
      const response = await fetch(`${API_URL}/predict/batch`, {
        method: 'POST',
        body: formDataUpload,
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

  // Filter batch results by segment
  const getFilteredBatchResults = () => {
    if (!batchResults) return []
    if (selectedSegment === 'all') return batchResults.predictions
    return batchResults.predictions.filter(p => p.risk_level === selectedSegment)
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
          style={activeTab === 'dashboard' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          style={activeTab === 'single' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('single')}
        >
          Predict
        </button>
        <button
          style={activeTab === 'batch' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('batch')}
        >
          Batch CSV
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

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div style={styles.dashboardContainer}>
          {/* KPI Cards */}
          <div style={styles.kpiGrid}>
            <div style={{...styles.kpiCard, borderColor: '#3b82f6'}}>
              <div style={styles.kpiIcon}>📊</div>
              <div style={styles.kpiContent}>
                <div style={styles.kpiValue}>{historyStats?.total_predictions || 0}</div>
                <div style={styles.kpiLabel}>Total Predictions</div>
              </div>
            </div>
            <div style={{...styles.kpiCard, borderColor: '#ef4444'}}>
              <div style={styles.kpiIcon}>⚠️</div>
              <div style={styles.kpiContent}>
                <div style={{...styles.kpiValue, color: '#ef4444'}}>{historyStats?.overall_churn_rate || 0}%</div>
                <div style={styles.kpiLabel}>Overall Churn Rate</div>
              </div>
            </div>
            <div style={{...styles.kpiCard, borderColor: '#f59e0b'}}>
              <div style={styles.kpiIcon}>📈</div>
              <div style={styles.kpiContent}>
                <div style={{...styles.kpiValue, color: '#f59e0b'}}>{historyStats?.average_probability || 0}%</div>
                <div style={styles.kpiLabel}>Avg Churn Probability</div>
              </div>
            </div>
            <div style={{...styles.kpiCard, borderColor: '#22c55e'}}>
              <div style={styles.kpiIcon}>✅</div>
              <div style={styles.kpiContent}>
                <div style={{...styles.kpiValue, color: '#22c55e'}}>{metrics?.accuracy || 0}%</div>
                <div style={styles.kpiLabel}>Model Accuracy</div>
              </div>
            </div>
          </div>

          {/* Trend Chart - Line graph of recent predictions */}
          {historyStats?.recent_trend && historyStats.recent_trend.length > 0 && (
            <div style={styles.trendSection}>
              <h3 style={styles.chartTitle}>Churn Probability Trend (Recent Predictions)</h3>
              <div style={styles.trendChart}>
                <svg viewBox="0 0 600 200" style={styles.trendSvg}>
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((val, i) => (
                    <g key={val}>
                      <line x1="50" y1={180 - val * 1.6} x2="580" y2={180 - val * 1.6} stroke="#e5e7eb" strokeWidth="1" />
                      <text x="40" y={185 - val * 1.6} fontSize="10" fill="#9ca3af" textAnchor="end">{val}%</text>
                    </g>
                  ))}

                  {/* Trend line */}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={historyStats.recent_trend.map((item, idx) => {
                      const x = 60 + (idx * (520 / Math.max(historyStats.recent_trend.length - 1, 1)))
                      const y = 180 - (item.avg_probability * 1.6)
                      return `${x},${y}`
                    }).join(' ')}
                  />

                  {/* Data points */}
                  {historyStats.recent_trend.map((item, idx) => {
                    const x = 60 + (idx * (520 / Math.max(historyStats.recent_trend.length - 1, 1)))
                    const y = 180 - (item.avg_probability * 1.6)
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="6" fill="#3b82f6" />
                        <circle cx={x} cy={y} r="3" fill="white" />
                        <text x={x} y={195} fontSize="9" fill="#6b7280" textAnchor="middle">
                          {item.date?.slice(5) || `#${idx + 1}`}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Risk Distribution Donut Chart */}
          {historyStats?.risk_distribution && Object.keys(historyStats.risk_distribution).length > 0 && (
            <div style={styles.analyticsGrid}>
              <div style={styles.analyticsCard}>
                <h3 style={styles.chartTitle}>Risk Level Distribution</h3>
                <div style={styles.donutContainer}>
                  <svg viewBox="0 0 200 200" style={styles.donutChart}>
                    {(() => {
                      const total = Object.values(historyStats.risk_distribution).reduce((a, b) => a + b, 0)
                      if (total === 0) return null
                      let currentAngle = -90
                      const colors = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' }

                      return Object.entries(historyStats.risk_distribution).map(([level, count]) => {
                        if (count === 0) return null
                        const percentage = count / total
                        const angle = percentage * 360
                        const startAngle = currentAngle
                        const endAngle = currentAngle + angle
                        currentAngle = endAngle

                        const startRad = startAngle * Math.PI / 180
                        const endRad = endAngle * Math.PI / 180
                        const x1 = 100 + 70 * Math.cos(startRad)
                        const y1 = 100 + 70 * Math.sin(startRad)
                        const x2 = 100 + 70 * Math.cos(endRad)
                        const y2 = 100 + 70 * Math.sin(endRad)
                        const largeArc = angle > 180 ? 1 : 0

                        return (
                          <path
                            key={level}
                            d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={colors[level] || '#6b7280'}
                            stroke="white"
                            strokeWidth="2"
                          />
                        )
                      })
                    })()}
                    <circle cx="100" cy="100" r="40" fill="white" />
                    <text x="100" y="95" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#1f2937">
                      {historyStats?.total_predictions || 0}
                    </text>
                    <text x="100" y="115" fontSize="10" textAnchor="middle" fill="#6b7280">
                      Total
                    </text>
                  </svg>
                  <div style={styles.donutLegend}>
                    {Object.entries(historyStats.risk_distribution).map(([level, count]) => (
                      <div key={level} style={styles.legendRow}>
                        <span style={{...styles.legendDot, backgroundColor: getRiskColor(level)}}></span>
                        <span style={styles.legendText}>{level}</span>
                        <span style={styles.legendCount}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div style={styles.analyticsCard}>
                <h3 style={styles.chartTitle}>Quick Insights</h3>
                <div style={styles.insightsList}>
                  <div style={styles.insightItem}>
                    <span style={styles.insightLabel}>Highest Risk Segment</span>
                    <span style={{...styles.insightValue, color: '#ef4444'}}>
                      {historyStats?.risk_distribution ?
                        Object.entries(historyStats.risk_distribution)
                          .filter(([level]) => level !== 'Low')
                          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
                        : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.insightItem}>
                    <span style={styles.insightLabel}>Low Risk Customers</span>
                    <span style={{...styles.insightValue, color: '#22c55e'}}>
                      {historyStats?.risk_distribution?.Low || 0}
                    </span>
                  </div>
                  <div style={styles.insightItem}>
                    <span style={styles.insightLabel}>High + Critical Risk</span>
                    <span style={{...styles.insightValue, color: '#dc2626'}}>
                      {(historyStats?.risk_distribution?.High || 0) + (historyStats?.risk_distribution?.Critical || 0)}
                    </span>
                  </div>
                  <div style={styles.insightItem}>
                    <span style={styles.insightLabel}>Retention Opportunity</span>
                    <span style={styles.insightValue}>
                      {historyStats?.total_predictions ?
                        Math.round(((historyStats?.risk_distribution?.Medium || 0) / historyStats.total_predictions) * 100)
                        : 0}% at Medium Risk
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Model Performance */}
          {metrics && (
            <div style={styles.modelPerformance}>
              <h3 style={styles.chartTitle}>Model Performance</h3>
              <div style={styles.perfGrid}>
                <div style={styles.perfItem}>
                  <div style={styles.perfLabel}>Training Samples</div>
                  <div style={styles.perfValue}>{metrics.train_samples?.toLocaleString()}</div>
                </div>
                <div style={styles.perfItem}>
                  <div style={styles.perfLabel}>Test Samples</div>
                  <div style={styles.perfValue}>{metrics.test_samples?.toLocaleString()}</div>
                </div>
                <div style={styles.perfItem}>
                  <div style={styles.perfLabel}>Total Dataset</div>
                  <div style={styles.perfValue}>{metrics.total_samples?.toLocaleString()}</div>
                </div>
                <div style={styles.perfItem}>
                  <div style={styles.perfLabel}>Features Used</div>
                  <div style={styles.perfValue}>13</div>
                </div>
              </div>
            </div>
          )}

          {/* No data message */}
          {(!historyStats || historyStats.total_predictions === 0) && (
            <div style={styles.noDataMessage}>
              <div style={styles.noDataIcon}>📊</div>
              <h3 style={styles.noDataTitle}>No Analytics Data Yet</h3>
              <p style={styles.noDataText}>
                Start making predictions to see analytics here.
                Use the Predict or Batch CSV tabs to analyze customers.
              </p>
            </div>
          )}
        </div>
      )}

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

          {/* Prediction Result with Gauge */}
          {prediction && (
            <div style={{...styles.result, borderColor: getRiskColor(prediction.risk_level)}}>
              <h2 style={styles.resultTitle}>Prediction Result</h2>

              {/* Risk Gauge */}
              <div style={styles.gaugeContainer}>
                <svg viewBox="0 0 200 120" style={styles.gaugeSvg}>
                  {/* Background arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  {/* Colored sections */}
                  <path d="M 20 100 A 80 80 0 0 1 60 35" fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" />
                  <path d="M 60 35 A 80 80 0 0 1 100 20" fill="none" stroke="#f59e0b" strokeWidth="16" />
                  <path d="M 100 20 A 80 80 0 0 1 140 35" fill="none" stroke="#ef4444" strokeWidth="16" />
                  <path d="M 140 35 A 80 80 0 0 1 180 100" fill="none" stroke="#dc2626" strokeWidth="16" strokeLinecap="round" />
                  {/* Needle */}
                  <line
                    x1="100"
                    y1="100"
                    x2={100 + 60 * Math.cos(Math.PI - (prediction.churn_probability / 100) * Math.PI)}
                    y2={100 - 60 * Math.sin(Math.PI - (prediction.churn_probability / 100) * Math.PI)}
                    stroke="#1f2937"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="100" r="8" fill="#1f2937" />
                  {/* Labels */}
                  <text x="15" y="115" fontSize="10" fill="#6b7280">0%</text>
                  <text x="175" y="115" fontSize="10" fill="#6b7280">100%</text>
                </svg>
                <div style={styles.gaugeValue}>{prediction.churn_probability}%</div>
                <div style={styles.gaugeLabel}>Churn Probability</div>
              </div>

              <div style={styles.resultGrid}>
                <div style={styles.resultCard}>
                  <div style={{...styles.riskBadge, backgroundColor: getRiskColor(prediction.risk_level)}}>{prediction.risk_level}</div>
                  <div style={styles.resultLabel}>Risk Level</div>
                </div>
                <div style={styles.resultCard}>
                  <div style={{...styles.resultValue, color: prediction.will_churn ? '#dc2626' : '#22c55e'}}>{prediction.will_churn ? 'Yes' : 'No'}</div>
                  <div style={styles.resultLabel}>Will Churn?</div>
                </div>
              </div>

              {/* Risk Factors Breakdown */}
              {riskFactors.length > 0 && (
                <div style={styles.riskFactorsSection}>
                  <h3 style={styles.insightTitle}>Risk Factor Analysis</h3>
                  <div style={styles.factorsList}>
                    {riskFactors.map((factor, idx) => (
                      <div key={idx} style={{...styles.factorItem, borderLeftColor: getImpactColor(factor.impact)}}>
                        <div style={styles.factorHeader}>
                          <span style={styles.factorName}>{factor.factor}</span>
                          <span style={{...styles.impactBadge, backgroundColor: getImpactColor(factor.impact)}}>
                            {factor.impact === 'positive' ? 'Protective' : factor.impact.toUpperCase()}
                          </span>
                        </div>
                        <p style={styles.factorDescription}>{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Retention Recommendations */}
              {recommendations.length > 0 && (
                <div style={styles.recommendationsSection}>
                  <h3 style={styles.insightTitle}>Retention Recommendations</h3>
                  <div style={styles.recommendationsList}>
                    {recommendations.map((rec, idx) => (
                      <div key={idx} style={{...styles.recommendationItem, borderLeftColor: getPriorityColor(rec.priority)}}>
                        <div style={styles.recHeader}>
                          <span style={styles.recAction}>{rec.action}</span>
                          <span style={{...styles.priorityBadge, backgroundColor: getPriorityColor(rec.priority)}}>
                            {rec.priority.toUpperCase()}
                          </span>
                        </div>
                        <p style={styles.recDescription}>{rec.description}</p>
                        <span style={styles.recImpact}>{rec.expectedImpact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What-If Comparison */}
              <div style={styles.comparisonSection}>
                <button
                  style={styles.comparisonToggle}
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? 'Hide' : 'Show'} What-If Comparison
                </button>

                {showComparison && comparisonData && (
                  <div style={styles.comparisonPanel}>
                    <h4 style={styles.comparisonTitle}>Adjust values to see impact</h4>
                    <div style={styles.comparisonGrid}>
                      <div style={styles.comparisonField}>
                        <label style={styles.label}>Tenure</label>
                        <input type="number" name="tenure" value={comparisonData.tenure} onChange={handleComparisonChange} style={styles.comparisonInput} />
                      </div>
                      <div style={styles.comparisonField}>
                        <label style={styles.label}>Contract</label>
                        <select name="Contract" value={comparisonData.Contract} onChange={handleComparisonChange} style={styles.comparisonInput}>
                          <option value="Month-to-month">Month-to-month</option>
                          <option value="One year">One year</option>
                          <option value="Two year">Two year</option>
                        </select>
                      </div>
                      <div style={styles.comparisonField}>
                        <label style={styles.label}>Payment</label>
                        <select name="PaymentMethod" value={comparisonData.PaymentMethod} onChange={handleComparisonChange} style={styles.comparisonInput}>
                          <option value="Electronic check">Electronic check</option>
                          <option value="Mailed check">Mailed check</option>
                          <option value="Bank transfer (automatic)">Bank transfer</option>
                          <option value="Credit card (automatic)">Credit card</option>
                        </select>
                      </div>
                      <div style={styles.comparisonField}>
                        <label style={styles.label}>Online Security</label>
                        <select name="OnlineSecurity" value={comparisonData.OnlineSecurity} onChange={handleComparisonChange} style={styles.comparisonInput}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={runComparison} style={styles.compareButton} disabled={comparisonLoading}>
                      {comparisonLoading ? 'Calculating...' : 'Compare'}
                    </button>

                    {comparisonPrediction && (
                      <div style={styles.comparisonResult}>
                        <div style={styles.comparisonBox}>
                          <div style={styles.comparisonLabel}>Original</div>
                          <div style={{...styles.comparisonValue, color: getRiskColor(prediction.risk_level)}}>{prediction.churn_probability}%</div>
                        </div>
                        <div style={styles.comparisonArrow}>→</div>
                        <div style={styles.comparisonBox}>
                          <div style={styles.comparisonLabel}>With Changes</div>
                          <div style={{...styles.comparisonValue, color: getRiskColor(comparisonPrediction.risk_level)}}>{comparisonPrediction.churn_probability}%</div>
                        </div>
                        <div style={styles.comparisonDiff}>
                          {comparisonPrediction.churn_probability < prediction.churn_probability ? (
                            <span style={{color: '#22c55e'}}>↓ {(prediction.churn_probability - comparisonPrediction.churn_probability).toFixed(1)}% reduction</span>
                          ) : comparisonPrediction.churn_probability > prediction.churn_probability ? (
                            <span style={{color: '#dc2626'}}>↑ {(comparisonPrediction.churn_probability - prediction.churn_probability).toFixed(1)}% increase</span>
                          ) : (
                            <span style={{color: '#6b7280'}}>No change</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

              {/* Risk Distribution with Pie Chart */}
              <div style={styles.riskDistribution}>
                <h4 style={styles.chartTitle}>Risk Distribution</h4>
                <div style={styles.pieChartContainer}>
                  <svg viewBox="0 0 200 200" style={styles.pieChart}>
                    {(() => {
                      const total = batchResults.total_customers
                      const dist = batchResults.summary.risk_distribution
                      let currentAngle = 0
                      const segments = []
                      const colors = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' }

                      Object.entries(dist).forEach(([level, count]) => {
                        if (count > 0) {
                          const percentage = count / total
                          const angle = percentage * 360
                          const startAngle = currentAngle
                          const endAngle = currentAngle + angle

                          const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180)
                          const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180)
                          const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180)
                          const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180)

                          const largeArc = angle > 180 ? 1 : 0

                          segments.push(
                            <path
                              key={level}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[level]}
                              stroke="white"
                              strokeWidth="2"
                            />
                          )
                          currentAngle = endAngle
                        }
                      })
                      return segments
                    })()}
                  </svg>
                  <div style={styles.pieLegend}>
                    {Object.entries(batchResults.summary.risk_distribution).map(([level, count]) => (
                      <div key={level} style={styles.legendItem}>
                        <span style={{...styles.legendDot, backgroundColor: getRiskColor(level)}}></span>
                        <span>{level}: {count} ({((count / batchResults.total_customers) * 100).toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Segments */}
              <div style={styles.segmentsSection}>
                <h4 style={styles.chartTitle}>Customer Segments</h4>
                <div style={styles.segmentTabs}>
                  <button
                    style={selectedSegment === 'all' ? styles.segmentTabActive : styles.segmentTab}
                    onClick={() => setSelectedSegment('all')}
                  >
                    All ({batchResults.total_customers})
                  </button>
                  {Object.entries(batchResults.summary.risk_distribution).map(([level, count]) => (
                    <button
                      key={level}
                      style={selectedSegment === level ? styles.segmentTabActive : styles.segmentTab}
                      onClick={() => setSelectedSegment(level)}
                    >
                      <span style={{...styles.segmentDot, backgroundColor: getRiskColor(level)}}></span>
                      {level} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Table */}
              <div style={styles.tableContainer}>
                <h4 style={styles.chartTitle}>
                  {selectedSegment === 'all' ? 'All Customers' : `${selectedSegment} Risk Customers`}
                  ({getFilteredBatchResults().length})
                </h4>
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
                    {getFilteredBatchResults().map((pred, idx) => (
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
        ChurnShield AI v2.4 • XGBoost • {metrics ? `${metrics.total_samples?.toLocaleString()} samples` : ''}
      </p>
    </div>
  )
}

function getRiskColor(level) {
  const colors = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' }
  return colors[level] || '#6b7280'
}

function getImpactColor(impact) {
  const colors = { high: '#dc2626', medium: '#f59e0b', low: '#3b82f6', positive: '#22c55e' }
  return colors[impact] || '#6b7280'
}

function getPriorityColor(priority) {
  const colors = { critical: '#dc2626', high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' }
  return colors[priority] || '#6b7280'
}

const styles = {
  container: { maxWidth: '750px', margin: '40px auto', padding: '20px', fontFamily: 'system-ui, sans-serif' },
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
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  tab: { flex: '1 1 auto', minWidth: '120px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500', color: '#6b7280', textAlign: 'center' },
  tabActive: { flex: '1 1 auto', minWidth: '120px', padding: '12px', border: '2px solid #3b82f6', borderRadius: '8px', backgroundColor: '#eff6ff', cursor: 'pointer', fontWeight: '600', color: '#3b82f6', textAlign: 'center' },

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
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '20px' },
  resultCard: { textAlign: 'center', padding: '12px' },
  resultValue: { fontSize: '1.5rem', fontWeight: '700' },
  resultLabel: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  riskBadge: { display: 'inline-block', padding: '8px 16px', borderRadius: '20px', color: 'white', fontWeight: '600', fontSize: '14px' },

  // Gauge
  gaugeContainer: { textAlign: 'center', marginBottom: '10px' },
  gaugeSvg: { width: '200px', height: '120px' },
  gaugeValue: { fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginTop: '-10px' },
  gaugeLabel: { fontSize: '12px', color: '#6b7280' },

  // Risk Factors
  riskFactorsSection: { marginTop: '24px', padding: '16px', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #fef08a' },
  insightTitle: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' },
  factorsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  factorItem: { padding: '12px', backgroundColor: 'white', borderRadius: '6px', borderLeft: '4px solid', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  factorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  factorName: { fontWeight: '600', fontSize: '13px', color: '#1f2937' },
  impactBadge: { padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', color: 'white' },
  factorDescription: { fontSize: '12px', color: '#6b7280', margin: 0 },

  // Recommendations
  recommendationsSection: { marginTop: '16px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' },
  recommendationsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  recommendationItem: { padding: '12px', backgroundColor: 'white', borderRadius: '6px', borderLeft: '4px solid', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  recHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  recAction: { fontWeight: '600', fontSize: '13px', color: '#1f2937' },
  priorityBadge: { padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', color: 'white' },
  recDescription: { fontSize: '12px', color: '#6b7280', margin: '0 0 6px 0' },
  recImpact: { fontSize: '11px', fontWeight: '600', color: '#22c55e' },

  // Comparison
  comparisonSection: { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' },
  comparisonToggle: { width: '100%', padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#374151' },
  comparisonPanel: { marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  comparisonTitle: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px' },
  comparisonGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' },
  comparisonField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  comparisonInput: { padding: '8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '4px' },
  compareButton: { width: '100%', padding: '10px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  comparisonResult: { marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' },
  comparisonBox: { textAlign: 'center', padding: '12px 20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' },
  comparisonLabel: { fontSize: '11px', color: '#6b7280', marginBottom: '4px' },
  comparisonValue: { fontSize: '1.5rem', fontWeight: '700' },
  comparisonArrow: { fontSize: '24px', color: '#9ca3af' },
  comparisonDiff: { width: '100%', textAlign: 'center', fontWeight: '600', marginTop: '8px' },

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

  // Pie Chart
  pieChartContainer: { display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' },
  pieChart: { width: '150px', height: '150px' },
  pieLegend: { display: 'flex', flexDirection: 'column', gap: '8px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  legendDot: { width: '12px', height: '12px', borderRadius: '50%' },

  // Segments
  segmentsSection: { marginBottom: '16px' },
  segmentTabs: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  segmentTab: { padding: '8px 16px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' },
  segmentTabActive: { padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: '1px solid #3b82f6', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
  segmentDot: { width: '8px', height: '8px', borderRadius: '50%' },

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

  // Dashboard
  dashboardContainer: { display: 'flex', flexDirection: 'column', gap: '24px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  kpiCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '2px solid', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  kpiIcon: { fontSize: '28px' },
  kpiContent: { flex: 1 },
  kpiValue: { fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' },
  kpiLabel: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },

  // Trend Chart
  trendSection: { padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' },
  trendChart: { width: '100%', overflowX: 'auto' },
  trendSvg: { width: '100%', minWidth: '500px', height: '200px' },

  // Analytics Grid
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  analyticsCard: { padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' },

  // Donut Chart
  donutContainer: { display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' },
  donutChart: { width: '160px', height: '160px' },
  donutLegend: { display: 'flex', flexDirection: 'column', gap: '8px' },
  legendRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  legendText: { fontSize: '13px', flex: 1 },
  legendCount: { fontSize: '13px', fontWeight: '600' },

  // Insights List
  insightsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  insightItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  insightLabel: { fontSize: '13px', color: '#6b7280' },
  insightValue: { fontSize: '14px', fontWeight: '600', color: '#1f2937' },

  // Model Performance
  modelPerformance: { padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' },
  perfGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  perfItem: { textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  perfLabel: { fontSize: '11px', color: '#6b7280', marginBottom: '4px' },
  perfValue: { fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' },

  // No Data
  noDataMessage: { padding: '60px 20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' },
  noDataIcon: { fontSize: '48px', marginBottom: '16px' },
  noDataTitle: { fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '8px' },
  noDataText: { fontSize: '14px', color: '#6b7280', maxWidth: '400px', margin: '0 auto' },
}
