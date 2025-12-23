"""
CSS styles and theming for the Streamlit application.
"""


def get_custom_css() -> str:
    """Get custom CSS for the application."""
    return """
    <style>
    /* Import Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* Root variables */
    :root {
        --primary-color: #667eea;
        --secondary-color: #764ba2;
        --success-color: #48bb78;
        --warning-color: #ed8936;
        --danger-color: #f56565;
        --info-color: #4299e1;
        --dark-color: #2d3748;
        --light-color: #f7fafc;
        --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* Global styles */
    .stApp {
        font-family: 'Inter', sans-serif;
    }

    /* Header styling */
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        color: white;
        text-align: center;
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }

    .main-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }

    .main-header p {
        font-size: 1.1rem;
        opacity: 0.9;
    }

    /* Metric cards */
    .metric-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border: 1px solid #e2e8f0;
    }

    .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }

    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--dark-color);
    }

    .metric-label {
        font-size: 0.9rem;
        color: #718096;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Risk level badges */
    .risk-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
    }

    .risk-low {
        background: rgba(72, 187, 120, 0.15);
        color: #22543d;
        border: 1px solid rgba(72, 187, 120, 0.3);
    }

    .risk-medium {
        background: rgba(237, 137, 54, 0.15);
        color: #744210;
        border: 1px solid rgba(237, 137, 54, 0.3);
    }

    .risk-high {
        background: rgba(245, 101, 101, 0.15);
        color: #742a2a;
        border: 1px solid rgba(245, 101, 101, 0.3);
    }

    .risk-critical {
        background: rgba(197, 48, 48, 0.15);
        color: #63171b;
        border: 1px solid rgba(197, 48, 48, 0.3);
    }

    /* Recommendation cards */
    .recommendation-card {
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        padding: 1.25rem;
        border-radius: 12px;
        margin-bottom: 1rem;
        border-left: 4px solid var(--primary-color);
        transition: transform 0.2s ease;
    }

    .recommendation-card:hover {
        transform: translateX(5px);
    }

    .recommendation-priority {
        display: inline-block;
        width: 28px;
        height: 28px;
        background: var(--primary-color);
        color: white;
        border-radius: 50%;
        text-align: center;
        line-height: 28px;
        font-weight: 600;
        font-size: 0.9rem;
        margin-right: 0.75rem;
    }

    .recommendation-action {
        font-weight: 600;
        color: var(--dark-color);
        font-size: 1rem;
    }

    .recommendation-description {
        color: #4a5568;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }

    .recommendation-impact {
        color: var(--success-color);
        font-size: 0.85rem;
        font-weight: 500;
        margin-top: 0.5rem;
    }

    /* Section headers */
    .section-header {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--dark-color);
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--primary-color);
    }

    /* Data tables */
    .dataframe {
        border-radius: 10px !important;
        overflow: hidden;
    }

    /* Buttons */
    .stButton > button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    /* File uploader */
    .stFileUploader {
        border: 2px dashed #cbd5e0 !important;
        border-radius: 12px;
        padding: 2rem;
        background: #f7fafc;
    }

    .stFileUploader:hover {
        border-color: var(--primary-color) !important;
        background: rgba(102, 126, 234, 0.05);
    }

    /* Expander */
    .streamlit-expanderHeader {
        font-weight: 600;
        color: var(--dark-color);
    }

    /* Sidebar */
    .css-1d391kg {
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    }

    /* Alert boxes */
    .success-box {
        background: rgba(72, 187, 120, 0.1);
        border: 1px solid rgba(72, 187, 120, 0.3);
        border-radius: 10px;
        padding: 1rem;
        color: #22543d;
    }

    .warning-box {
        background: rgba(237, 137, 54, 0.1);
        border: 1px solid rgba(237, 137, 54, 0.3);
        border-radius: 10px;
        padding: 1rem;
        color: #744210;
    }

    .danger-box {
        background: rgba(245, 101, 101, 0.1);
        border: 1px solid rgba(245, 101, 101, 0.3);
        border-radius: 10px;
        padding: 1rem;
        color: #742a2a;
    }

    .info-box {
        background: rgba(66, 153, 225, 0.1);
        border: 1px solid rgba(66, 153, 225, 0.3);
        border-radius: 10px;
        padding: 1rem;
        color: #2c5282;
    }

    /* Stats grid */
    .stats-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    /* Progress bar */
    .stProgress > div > div {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }

    .stTabs [data-baseweb="tab"] {
        background: #f7fafc;
        border-radius: 8px 8px 0 0;
        padding: 10px 20px;
        font-weight: 500;
    }

    .stTabs [aria-selected="true"] {
        background: var(--primary-color);
        color: white;
    }

    /* Footer */
    .footer {
        text-align: center;
        padding: 2rem;
        color: #718096;
        font-size: 0.9rem;
        margin-top: 3rem;
        border-top: 1px solid #e2e8f0;
    }

    /* Animation */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
        animation: fadeIn 0.5s ease-out;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
    }

    /* Form inputs */
    .stSelectbox [data-baseweb="select"] {
        border-radius: 8px;
    }

    .stNumberInput input {
        border-radius: 8px;
    }

    .stTextInput input {
        border-radius: 8px;
    }
    </style>
    """


def render_header():
    """Render the main application header."""
    return """
    <div class="main-header animate-fade-in">
        <h1>ChurnShield AI</h1>
        <p>Intelligent Customer Churn Prediction & Retention Platform</p>
    </div>
    """


def render_metric_card(value: str, label: str, icon: str = "") -> str:
    """Render a metric card."""
    return f"""
    <div class="metric-card animate-fade-in">
        <div class="metric-value">{icon} {value}</div>
        <div class="metric-label">{label}</div>
    </div>
    """


def render_risk_badge(risk_level: str) -> str:
    """Render a risk level badge."""
    level_class = f"risk-{risk_level.lower()}"
    return f'<span class="risk-badge {level_class}">{risk_level}</span>'


def render_recommendation_card(
    priority: int,
    action: str,
    description: str,
    impact: str
) -> str:
    """Render a recommendation card."""
    return f"""
    <div class="recommendation-card animate-fade-in">
        <div>
            <span class="recommendation-priority">{priority}</span>
            <span class="recommendation-action">{action}</span>
        </div>
        <div class="recommendation-description">{description}</div>
        <div class="recommendation-impact">Expected Impact: {impact}</div>
    </div>
    """


def render_section_header(title: str) -> str:
    """Render a section header."""
    return f'<h2 class="section-header">{title}</h2>'


def render_info_box(message: str, box_type: str = "info") -> str:
    """Render an info/alert box."""
    return f'<div class="{box_type}-box">{message}</div>'


def render_footer() -> str:
    """Render the application footer."""
    return """
    <div class="footer">
        <p>ChurnShield AI v1.0.0 | Powered by XGBoost & Streamlit</p>
        <p>Reduce churn, retain customers, grow revenue.</p>
    </div>
    """
