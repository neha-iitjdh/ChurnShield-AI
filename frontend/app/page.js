'use client'

/**
 * ChurnShield AI - Frontend v3.0
 *
 * CRM-Style Interface with:
 * - Sidebar navigation
 * - Customer health scores
 * - Actionable insights panels
 * - Quick actions & workflows
 * - Modern CRM dashboard
 * - Customer lifecycle tracking
 * - Retention campaign suggestions
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

  // Calculate customer health score (0-100)
  const calculateHealthScore = () => {
    if (!historyStats || historyStats.total_predictions === 0) return null
    const churnRate = historyStats.overall_churn_rate || 0
    return Math.round(100 - churnRate)
  }

  const healthScore = calculateHealthScore()

  return (
    <div style={styles.appContainer}>
      {/* Sidebar Navigation */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogo}>🛡️</div>
          <div style={styles.sidebarBrand}>
            <span style={styles.sidebarTitle}>ChurnShield</span>
            <span style={styles.sidebarSubtitle}>AI Platform</span>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button
            style={activeTab === 'dashboard' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('dashboard')}
          >
            <span style={styles.navIcon}>📊</span>
            <span>Dashboard</span>
          </button>
          <button
            style={activeTab === 'single' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('single')}
          >
            <span style={styles.navIcon}>👤</span>
            <span>Customer Analysis</span>
          </button>
          <button
            style={activeTab === 'batch' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('batch')}
          >
            <span style={styles.navIcon}>📁</span>
            <span>Batch Import</span>
          </button>
          <button
            style={activeTab === 'history' ? styles.navItemActive : styles.navItem}
            onClick={() => setActiveTab('history')}
          >
            <span style={styles.navIcon}>📋</span>
            <span>Prediction Log</span>
          </button>
        </nav>

        {/* Sidebar Quick Stats */}
        <div style={styles.sidebarStats}>
          <div style={styles.sidebarStatItem}>
            <span style={styles.sidebarStatLabel}>Model Accuracy</span>
            <span style={styles.sidebarStatValue}>{metrics?.accuracy || '--'}%</span>
          </div>
          <div style={styles.sidebarStatItem}>
            <span style={styles.sidebarStatLabel}>Total Analyzed</span>
            <span style={styles.sidebarStatValue}>{historyStats?.total_predictions || 0}</span>
          </div>
        </div>

        <div style={styles.sidebarFooter}>
          <span>v3.0 • XGBoost</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <h1 style={styles.pageTitle}>
              {activeTab === 'dashboard' && '📊 Analytics Dashboard'}
              {activeTab === 'single' && '👤 Customer Analysis'}
              {activeTab === 'batch' && '📁 Batch Import'}
              {activeTab === 'history' && '📋 Prediction Log'}
            </h1>
            <span style={styles.breadcrumb}>ChurnShield AI / {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
          </div>
          <div style={styles.topBarRight}>
            {healthScore !== null && (
              <div style={styles.healthScoreWidget}>
                <div style={styles.healthScoreCircle}>
                  <svg viewBox="0 0 36 36" style={styles.healthScoreSvg}>
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={healthScore >= 70 ? '#22c55e' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${healthScore}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span style={styles.healthScoreValue}>{healthScore}</span>
                </div>
                <div style={styles.healthScoreInfo}>
                  <span style={styles.healthScoreLabel}>Customer Health</span>
                  <span style={{...styles.healthScoreStatus, color: healthScore >= 70 ? '#22c55e' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}}>
                    {healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'At Risk' : 'Critical'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Error Display */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div style={styles.dashboardContainer}>
          {/* Quick Actions Bar */}
          <div style={styles.quickActionsBar}>
            <button style={styles.quickAction} onClick={() => setActiveTab('single')}>
              <span style={styles.quickActionIcon}>➕</span>
              <span>New Analysis</span>
            </button>
            <button style={styles.quickAction} onClick={() => setActiveTab('batch')}>
              <span style={styles.quickActionIcon}>📤</span>
              <span>Import CSV</span>
            </button>
            <button style={styles.quickAction} onClick={() => setActiveTab('history')}>
              <span style={styles.quickActionIcon}>📋</span>
              <span>View Log</span>
            </button>
          </div>

          {/* KPI Cards */}
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiIconSmall}>👥</span>
                <span style={styles.kpiTrend}>Total</span>
              </div>
              <div style={styles.kpiValue}>{historyStats?.total_predictions || 0}</div>
              <div style={styles.kpiLabel}>Customers Analyzed</div>
              <div style={styles.kpiProgress}>
                <div style={{...styles.kpiProgressBar, width: '100%', background: '#3b82f6'}}></div>
              </div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiIconSmall}>⚠️</span>
                <span style={{...styles.kpiTrend, color: '#ef4444'}}>Alert</span>
              </div>
              <div style={{...styles.kpiValue, color: '#ef4444'}}>{historyStats?.overall_churn_rate || 0}%</div>
              <div style={styles.kpiLabel}>Churn Rate</div>
              <div style={styles.kpiProgress}>
                <div style={{...styles.kpiProgressBar, width: `${historyStats?.overall_churn_rate || 0}%`, background: '#ef4444'}}></div>
              </div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiIconSmall}>🎯</span>
                <span style={styles.kpiTrend}>Avg</span>
              </div>
              <div style={{...styles.kpiValue, color: '#f59e0b'}}>{historyStats?.average_probability || 0}%</div>
              <div style={styles.kpiLabel}>Risk Probability</div>
              <div style={styles.kpiProgress}>
                <div style={{...styles.kpiProgressBar, width: `${historyStats?.average_probability || 0}%`, background: '#f59e0b'}}></div>
              </div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiIconSmall}>✅</span>
                <span style={{...styles.kpiTrend, color: '#22c55e'}}>Model</span>
              </div>
              <div style={{...styles.kpiValue, color: '#22c55e'}}>{metrics?.accuracy || 0}%</div>
              <div style={styles.kpiLabel}>Prediction Accuracy</div>
              <div style={styles.kpiProgress}>
                <div style={{...styles.kpiProgressBar, width: `${metrics?.accuracy || 0}%`, background: '#22c55e'}}></div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div style={styles.dashboardGrid}>
            {/* Left Column - Charts */}
            <div style={styles.dashboardLeft}>
              {/* Risk Distribution Card */}
              <div style={styles.crmCard}>
                <div style={styles.crmCardHeader}>
                  <h3 style={styles.crmCardTitle}>Customer Risk Segments</h3>
                  <span style={styles.crmCardBadge}>Live</span>
                </div>
                {historyStats?.risk_distribution && Object.keys(historyStats.risk_distribution).length > 0 ? (
                  <div style={styles.riskSegmentsGrid}>
                    {['Critical', 'High', 'Medium', 'Low'].map(level => {
                      const count = historyStats.risk_distribution[level] || 0
                      const total = historyStats.total_predictions || 1
                      const percentage = Math.round((count / total) * 100)
                      return (
                        <div key={level} style={styles.riskSegmentCard}>
                          <div style={{...styles.riskSegmentIndicator, background: getRiskColor(level)}}></div>
                          <div style={styles.riskSegmentContent}>
                            <span style={styles.riskSegmentLabel}>{level}</span>
                            <span style={styles.riskSegmentCount}>{count}</span>
                            <span style={styles.riskSegmentPercent}>{percentage}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={styles.emptySegments}>No segment data available</div>
                )}
              </div>

              {/* Trend Chart */}
              {historyStats?.recent_trend && historyStats.recent_trend.length > 0 && (
                <div style={styles.crmCard}>
                  <div style={styles.crmCardHeader}>
                    <h3 style={styles.crmCardTitle}>Churn Trend Analysis</h3>
                    <span style={styles.crmCardSubtitle}>Last 7 days</span>
                  </div>
                  <div style={styles.trendChart}>
                    <svg viewBox="0 0 600 180" style={styles.trendSvg}>
                      {/* Grid lines */}
                      {[0, 25, 50, 75, 100].map((val) => (
                        <g key={val}>
                          <line x1="50" y1={160 - val * 1.4} x2="580" y2={160 - val * 1.4} stroke="#f1f5f9" strokeWidth="1" />
                          <text x="40" y={165 - val * 1.4} fontSize="10" fill="#94a3b8" textAnchor="end">{val}%</text>
                        </g>
                      ))}
                      {/* Area fill */}
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                        </linearGradient>
                      </defs>
                      <path
                        fill="url(#areaGradient)"
                        d={`M 60 160 ${historyStats.recent_trend.map((item, idx) => {
                          const x = 60 + (idx * (520 / Math.max(historyStats.recent_trend.length - 1, 1)))
                          const y = 160 - (item.avg_probability * 1.4)
                          return `L ${x} ${y}`
                        }).join(' ')} L ${60 + (520)} 160 Z`}
                      />
                      {/* Trend line */}
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={historyStats.recent_trend.map((item, idx) => {
                          const x = 60 + (idx * (520 / Math.max(historyStats.recent_trend.length - 1, 1)))
                          const y = 160 - (item.avg_probability * 1.4)
                          return `${x},${y}`
                        }).join(' ')}
                      />
                      {/* Data points */}
                      {historyStats.recent_trend.map((item, idx) => {
                        const x = 60 + (idx * (520 / Math.max(historyStats.recent_trend.length - 1, 1)))
                        const y = 160 - (item.avg_probability * 1.4)
                        return (
                          <g key={idx}>
                            <circle cx={x} cy={y} r="5" fill="#3b82f6" />
                            <circle cx={x} cy={y} r="2.5" fill="white" />
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>
              )}

              {/* Feature Importance */}
              {metrics?.feature_importance && (
                <div style={styles.crmCard}>
                  <div style={styles.crmCardHeader}>
                    <h3 style={styles.crmCardTitle}>Churn Drivers</h3>
                    <span style={styles.crmCardSubtitle}>Top factors</span>
                  </div>
                  <div style={styles.driversGrid}>
                    {Object.entries(metrics.feature_importance).slice(0, 5).map(([feature, importance]) => (
                      <div key={feature} style={styles.driverItem}>
                        <div style={styles.driverHeader}>
                          <span style={styles.driverName}>{feature}</span>
                          <span style={styles.driverValue}>{importance}%</span>
                        </div>
                        <div style={styles.driverBar}>
                          <div style={{
                            ...styles.driverBarFill,
                            width: `${importance}%`,
                            background: importance > 20 ? '#ef4444' : importance > 10 ? '#f59e0b' : '#3b82f6'
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Insights & Actions */}
            <div style={styles.dashboardRight}>
              {/* Actionable Insights Panel */}
              <div style={styles.insightsPanel}>
                <div style={styles.insightsPanelHeader}>
                  <span style={styles.insightsPanelIcon}>💡</span>
                  <h3 style={styles.insightsPanelTitle}>Actionable Insights</h3>
                </div>
                <div style={styles.insightCards}>
                  {historyStats?.total_predictions > 0 ? (
                    <>
                      {/* Urgent Alert */}
                      {((historyStats?.risk_distribution?.High || 0) + (historyStats?.risk_distribution?.Critical || 0)) > 0 && (
                        <div style={{...styles.insightCard, borderLeftColor: '#ef4444'}}>
                          <div style={styles.insightCardHeader}>
                            <span style={styles.insightCardIcon}>🚨</span>
                            <span style={styles.insightCardPriority}>Urgent</span>
                          </div>
                          <p style={styles.insightCardText}>
                            <strong>{(historyStats?.risk_distribution?.High || 0) + (historyStats?.risk_distribution?.Critical || 0)}</strong> customers need immediate attention.
                            Consider launching a retention campaign.
                          </p>
                          <button style={styles.insightCardAction} onClick={() => setActiveTab('history')}>View At-Risk Customers →</button>
                        </div>
                      )}

                      {/* Opportunity */}
                      {(historyStats?.risk_distribution?.Medium || 0) > 0 && (
                        <div style={{...styles.insightCard, borderLeftColor: '#f59e0b'}}>
                          <div style={styles.insightCardHeader}>
                            <span style={styles.insightCardIcon}>🎯</span>
                            <span style={{...styles.insightCardPriority, background: '#fef3c7', color: '#92400e'}}>Opportunity</span>
                          </div>
                          <p style={styles.insightCardText}>
                            <strong>{historyStats?.risk_distribution?.Medium || 0}</strong> customers at medium risk.
                            Proactive engagement could prevent {Math.round((historyStats?.risk_distribution?.Medium || 0) * 0.3)} potential churns.
                          </p>
                          <button style={{...styles.insightCardAction, color: '#d97706'}}>Launch Engagement Campaign →</button>
                        </div>
                      )}

                      {/* Positive */}
                      {(historyStats?.risk_distribution?.Low || 0) > 0 && (
                        <div style={{...styles.insightCard, borderLeftColor: '#22c55e'}}>
                          <div style={styles.insightCardHeader}>
                            <span style={styles.insightCardIcon}>✨</span>
                            <span style={{...styles.insightCardPriority, background: '#dcfce7', color: '#166534'}}>Positive</span>
                          </div>
                          <p style={styles.insightCardText}>
                            <strong>{historyStats?.risk_distribution?.Low || 0}</strong> loyal customers identified.
                            Great candidates for referral or upsell programs.
                          </p>
                          <button style={{...styles.insightCardAction, color: '#16a34a'}}>Create Loyalty Rewards →</button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={styles.noInsights}>
                      <span style={styles.noInsightsIcon}>📊</span>
                      <p>Analyze customers to generate insights</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div style={styles.activityPanel}>
                <div style={styles.activityHeader}>
                  <h3 style={styles.activityTitle}>Recent Activity</h3>
                  <button style={styles.activityViewAll} onClick={() => setActiveTab('history')}>View All</button>
                </div>
                <div style={styles.activityList}>
                  {history.slice(0, 5).map((pred, idx) => (
                    <div key={pred.id || idx} style={styles.activityItem}>
                      <div style={{...styles.activityDot, background: getRiskColor(pred.risk_level)}}></div>
                      <div style={styles.activityContent}>
                        <span style={styles.activityText}>
                          {pred.prediction_type === 'batch' ? 'Batch analysis' : 'Customer analyzed'} - {pred.risk_level} risk
                        </span>
                        <span style={styles.activityTime}>
                          {new Date(pred.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span style={{...styles.activityBadge, background: getRiskColor(pred.risk_level)}}>
                        {pred.churn_probability}%
                      </span>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div style={styles.noActivity}>No recent activity</div>
                  )}
                </div>
              </div>

              {/* Model Info */}
              {metrics && (
                <div style={styles.modelInfoCard}>
                  <h4 style={styles.modelInfoTitle}>Model Information</h4>
                  <div style={styles.modelInfoGrid}>
                    <div style={styles.modelInfoItem}>
                      <span style={styles.modelInfoLabel}>Algorithm</span>
                      <span style={styles.modelInfoValue}>XGBoost</span>
                    </div>
                    <div style={styles.modelInfoItem}>
                      <span style={styles.modelInfoLabel}>Training Data</span>
                      <span style={styles.modelInfoValue}>{metrics.train_samples?.toLocaleString()}</span>
                    </div>
                    <div style={styles.modelInfoItem}>
                      <span style={styles.modelInfoLabel}>Features</span>
                      <span style={styles.modelInfoValue}>13</span>
                    </div>
                    <div style={styles.modelInfoItem}>
                      <span style={styles.modelInfoLabel}>Accuracy</span>
                      <span style={styles.modelInfoValue}>{metrics.accuracy}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* No data message */}
          {(!historyStats || historyStats.total_predictions === 0) && (
            <div style={styles.welcomeCard}>
              <div style={styles.welcomeIcon}>👋</div>
              <h2 style={styles.welcomeTitle}>Welcome to ChurnShield AI</h2>
              <p style={styles.welcomeText}>
                Start analyzing your customers to prevent churn and boost retention.
                Use the sidebar navigation to get started.
              </p>
              <div style={styles.welcomeActions}>
                <button style={styles.welcomePrimary} onClick={() => setActiveTab('single')}>
                  Analyze Single Customer
                </button>
                <button style={styles.welcomeSecondary} onClick={() => setActiveTab('batch')}>
                  Import Customer CSV
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Prediction Tab */}
      {activeTab === 'single' && (
        <div style={styles.contentContainer}>
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
          </form>

          <button type="button" onClick={handleSubmit} style={styles.submitButton} disabled={loading}>
            {loading ? 'Predicting...' : 'Predict Churn Risk'}
          </button>

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
        </div>
      )}

      {/* Batch Upload Tab */}
      {activeTab === 'batch' && (
        <div style={styles.contentContainer}>
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
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={styles.contentContainer}>
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
        </div>
      )}

      </div>
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
  // App Container - CRM Layout
  appContainer: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f1f5f9' },

  // Sidebar
  sidebar: { width: '260px', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: 'white', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100 },
  sidebarHeader: { padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  sidebarLogo: { fontSize: '32px' },
  sidebarBrand: { display: 'flex', flexDirection: 'column' },
  sidebarTitle: { fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' },
  sidebarSubtitle: { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' },
  sidebarNav: { padding: '20px 12px', flex: 1 },
  navItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: 'none', background: 'transparent', color: '#94a3b8', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', textAlign: 'left', marginBottom: '4px', transition: 'all 0.2s ease' },
  navItemActive: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', textAlign: 'left', marginBottom: '4px', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' },
  navIcon: { fontSize: '18px' },
  sidebarStats: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' },
  sidebarStatItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' },
  sidebarStatLabel: { fontSize: '12px', color: '#94a3b8' },
  sidebarStatValue: { fontSize: '14px', fontWeight: '700', color: '#22c55e' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#64748b', textAlign: 'center' },

  // Main Content
  mainContent: { flex: 1, marginLeft: '260px', minHeight: '100vh' },

  // Top Bar
  topBar: { background: 'white', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 },
  topBarLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
  pageTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 },
  breadcrumb: { fontSize: '12px', color: '#94a3b8' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '16px' },

  // Health Score Widget
  healthScoreWidget: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' },
  healthScoreCircle: { position: 'relative', width: '44px', height: '44px' },
  healthScoreSvg: { width: '44px', height: '44px', transform: 'rotate(-90deg)' },
  healthScoreValue: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: '700', color: '#1e293b' },
  healthScoreInfo: { display: 'flex', flexDirection: 'column' },
  healthScoreLabel: { fontSize: '11px', color: '#64748b' },
  healthScoreStatus: { fontSize: '13px', fontWeight: '600' },

  // Quick Actions Bar
  quickActionsBar: { display: 'flex', gap: '12px', marginBottom: '24px' },
  quickAction: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: '2px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569', transition: 'all 0.2s ease' },
  quickActionIcon: { fontSize: '16px' },

  // Dashboard Container
  dashboardContainer: { padding: '24px 32px' },

  // KPI Grid - CRM Style
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' },
  kpiCard: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  kpiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  kpiIconSmall: { fontSize: '20px' },
  kpiTrend: { fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  kpiValue: { fontSize: '2rem', fontWeight: '800', color: '#1e293b', marginBottom: '4px' },
  kpiLabel: { fontSize: '13px', color: '#64748b', marginBottom: '12px' },
  kpiProgress: { height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' },
  kpiProgressBar: { height: '100%', borderRadius: '2px', transition: 'width 0.6s ease' },

  // Dashboard Grid
  dashboardGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' },
  dashboardLeft: { display: 'flex', flexDirection: 'column', gap: '20px' },
  dashboardRight: { display: 'flex', flexDirection: 'column', gap: '20px' },

  // CRM Cards
  crmCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  crmCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  crmCardTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 },
  crmCardBadge: { fontSize: '10px', fontWeight: '700', color: '#22c55e', background: '#dcfce7', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' },
  crmCardSubtitle: { fontSize: '12px', color: '#94a3b8' },

  // Risk Segments Grid
  riskSegmentsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  riskSegmentCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '12px' },
  riskSegmentIndicator: { width: '4px', height: '40px', borderRadius: '2px' },
  riskSegmentContent: { display: 'flex', flexDirection: 'column' },
  riskSegmentLabel: { fontSize: '12px', color: '#64748b', marginBottom: '2px' },
  riskSegmentCount: { fontSize: '20px', fontWeight: '700', color: '#1e293b' },
  riskSegmentPercent: { fontSize: '11px', color: '#94a3b8' },
  emptySegments: { padding: '40px', textAlign: 'center', color: '#94a3b8' },

  // Drivers Grid
  driversGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  driverItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
  driverHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  driverName: { fontSize: '13px', fontWeight: '500', color: '#475569' },
  driverValue: { fontSize: '13px', fontWeight: '700', color: '#1e293b' },
  driverBar: { height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' },
  driverBarFill: { height: '100%', borderRadius: '3px', transition: 'width 0.6s ease' },

  // Insights Panel
  insightsPanel: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  insightsPanelHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  insightsPanelIcon: { fontSize: '20px' },
  insightsPanelTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 },
  insightCards: { display: 'flex', flexDirection: 'column', gap: '12px' },
  insightCard: { padding: '16px', background: '#fafafa', borderRadius: '12px', borderLeft: '4px solid' },
  insightCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  insightCardIcon: { fontSize: '16px' },
  insightCardPriority: { fontSize: '10px', fontWeight: '700', background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '10px', textTransform: 'uppercase' },
  insightCardText: { fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 10px 0' },
  insightCardAction: { background: 'none', border: 'none', fontSize: '12px', fontWeight: '600', color: '#3b82f6', cursor: 'pointer', padding: 0 },
  noInsights: { padding: '30px', textAlign: 'center', color: '#94a3b8' },
  noInsightsIcon: { fontSize: '32px', marginBottom: '8px', display: 'block' },

  // Activity Panel
  activityPanel: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  activityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  activityTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 },
  activityViewAll: { background: 'none', border: 'none', fontSize: '12px', fontWeight: '600', color: '#3b82f6', cursor: 'pointer' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  activityItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f8fafc', borderRadius: '10px' },
  activityDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  activityContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  activityText: { fontSize: '12px', color: '#475569' },
  activityTime: { fontSize: '11px', color: '#94a3b8' },
  activityBadge: { fontSize: '11px', fontWeight: '700', color: 'white', padding: '3px 8px', borderRadius: '10px' },
  noActivity: { padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' },

  // Model Info Card
  modelInfoCard: { background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: '16px', padding: '20px', color: 'white' },
  modelInfoTitle: { fontSize: '13px', fontWeight: '600', marginBottom: '16px', margin: '0 0 16px 0', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  modelInfoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  modelInfoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  modelInfoLabel: { fontSize: '11px', color: '#94a3b8' },
  modelInfoValue: { fontSize: '14px', fontWeight: '700', color: 'white' },

  // Welcome Card
  welcomeCard: { background: 'white', borderRadius: '24px', padding: '60px 40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  welcomeIcon: { fontSize: '64px', marginBottom: '20px' },
  welcomeTitle: { fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', marginBottom: '12px' },
  welcomeText: { fontSize: '15px', color: '#64748b', maxWidth: '450px', margin: '0 auto 24px', lineHeight: '1.6' },
  welcomeActions: { display: 'flex', gap: '12px', justifyContent: 'center' },
  welcomePrimary: { padding: '14px 28px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' },
  welcomeSecondary: { padding: '14px 28px', background: 'white', color: '#475569', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },

  // Trend Chart
  trendChart: { width: '100%', overflowX: 'auto' },
  trendSvg: { width: '100%', minWidth: '400px', height: '180px' },

  // Form
  form: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  section: { padding: '24px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#374151' },
  input: { padding: '12px 16px', fontSize: '14px', border: '2px solid #e5e7eb', borderRadius: '10px', backgroundColor: '#f9fafb', transition: 'all 0.2s ease', outline: 'none' },
  button: { padding: '14px', fontSize: '16px', fontWeight: '600', color: 'white', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(102,126,234,0.4)' },
  submitButton: { width: '100%', padding: '18px', fontSize: '16px', fontWeight: '700', color: 'white', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 16px rgba(102,126,234,0.4)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  error: { padding: '16px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', color: '#dc2626', borderRadius: '12px', textAlign: 'center', marginBottom: '16px', fontWeight: '500', border: '1px solid #fecaca' },

  // Results
  result: { marginTop: '24px', padding: '28px', border: 'none', borderRadius: '20px', background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' },
  resultTitle: { fontSize: '1.25rem', marginBottom: '20px', color: '#1f2937', fontWeight: '700' },
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '24px' },
  resultCard: { textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px' },
  resultValue: { fontSize: '1.75rem', fontWeight: '700' },
  resultLabel: { fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: '500' },
  riskBadge: { display: 'inline-block', padding: '10px 20px', borderRadius: '25px', color: 'white', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },

  // Gauge
  gaugeContainer: { textAlign: 'center', marginBottom: '16px', padding: '20px', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', borderRadius: '16px' },
  gaugeSvg: { width: '220px', height: '130px' },
  gaugeValue: { fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', marginTop: '-8px' },
  gaugeLabel: { fontSize: '13px', color: '#64748b', fontWeight: '500' },

  // Risk Factors
  riskFactorsSection: { marginTop: '24px', padding: '20px', background: 'linear-gradient(135deg, #fefce8, #fef9c3)', borderRadius: '16px' },
  insightTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' },
  factorsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  factorItem: { padding: '16px', backgroundColor: 'white', borderRadius: '12px', borderLeft: '4px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  factorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  factorName: { fontWeight: '700', fontSize: '14px', color: '#1e293b' },
  impactBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', color: 'white', textTransform: 'uppercase' },
  factorDescription: { fontSize: '13px', color: '#64748b', margin: 0 },

  // Recommendations
  recommendationsSection: { marginTop: '20px', padding: '20px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: '16px' },
  recommendationsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  recommendationItem: { padding: '16px', backgroundColor: 'white', borderRadius: '12px', borderLeft: '4px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  recHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  recAction: { fontWeight: '700', fontSize: '14px', color: '#1e293b' },
  priorityBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', color: 'white', textTransform: 'uppercase' },
  recDescription: { fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' },
  recImpact: { fontSize: '12px', fontWeight: '700', color: '#059669', background: '#d1fae5', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' },

  // Comparison
  comparisonSection: { marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' },
  comparisonToggle: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '14px' },
  comparisonPanel: { marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '16px' },
  comparisonTitle: { fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' },
  comparisonGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' },
  comparisonField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  comparisonInput: { padding: '10px 14px', fontSize: '13px', border: '2px solid #e2e8f0', borderRadius: '10px', background: 'white' },
  compareButton: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' },
  comparisonResult: { marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' },
  comparisonBox: { textAlign: 'center', padding: '16px 24px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  comparisonLabel: { fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase' },
  comparisonValue: { fontSize: '2rem', fontWeight: '800' },
  comparisonArrow: { fontSize: '28px', color: '#94a3b8' },
  comparisonDiff: { width: '100%', textAlign: 'center', fontWeight: '700', marginTop: '12px', fontSize: '15px' },

  // Batch
  batchSection: { padding: '28px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  helpText: { fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.6' },
  uploadForm: { display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' },
  fileInput: { flex: 1, minWidth: '200px', padding: '14px 18px', border: '2px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc', cursor: 'pointer' },
  batchResults: { marginTop: '28px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' },
  summaryCard: { padding: '24px 20px', background: 'white', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '2px solid transparent', transition: 'all 0.2s ease' },
  summaryValue: { fontSize: '2rem', fontWeight: '800', color: '#1e293b' },
  summaryLabel: { fontSize: '11px', color: '#64748b', marginTop: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' },

  // Pie Chart
  pieChartContainer: { display: 'flex', alignItems: 'center', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' },
  pieChart: { width: '180px', height: '180px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' },
  pieLegend: { display: 'flex', flexDirection: 'column', gap: '10px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '500' },
  legendDot: { width: '14px', height: '14px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },

  // Segments
  segmentsSection: { marginBottom: '20px' },
  segmentTabs: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  segmentTab: { padding: '10px 18px', backgroundColor: 'white', border: '2px solid #e2e8f0', borderRadius: '25px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' },
  segmentTabActive: { padding: '10px 18px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: '2px solid transparent', borderRadius: '25px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' },
  segmentDot: { width: '10px', height: '10px', borderRadius: '50%' },

  // Risk Distribution
  riskDistribution: { padding: '24px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px' },
  riskBars: { display: 'flex', flexDirection: 'column', gap: '16px' },
  riskBarItem: { display: 'grid', gridTemplateColumns: '80px 1fr 50px', gap: '16px', alignItems: 'center' },
  riskBarLabel: { fontSize: '14px', fontWeight: '600', color: '#475569' },
  riskBarTrack: { height: '32px', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' },
  riskBarFill: { height: '100%', borderRadius: '10px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' },
  riskBarCount: { fontSize: '16px', fontWeight: '700', textAlign: 'right', color: '#1e293b' },

  // Table
  tableContainer: { backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '16px 20px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', textAlign: 'left', fontWeight: '700', color: '#475569', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s ease' },
  trChurn: { borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' },
  td: { padding: '16px 20px' },
  tableBadge: { padding: '6px 14px', borderRadius: '20px', color: 'white', fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' },
  typeBadge: { padding: '5px 12px', borderRadius: '20px', color: 'white', fontSize: '11px', fontWeight: '700' },

  // History
  historyStats: { marginBottom: '28px' },
  loading: { padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px' },
  emptyState: { padding: '60px', textAlign: 'center', color: '#64748b' },
  clearButton: { padding: '12px 20px', fontSize: '13px', fontWeight: '700', color: '#dc2626', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.1)' },
  deleteButton: { padding: '8px 14px', fontSize: '12px', color: '#ef4444', backgroundColor: 'transparent', border: '2px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s ease' },

  // Content container for other tabs
  contentContainer: { padding: '24px 32px' },
}
