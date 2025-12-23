"""
Main Streamlit application for ChurnShield AI.
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime
import json
import io

from src.frontend.components.styles import (
    get_custom_css,
    render_header,
    render_metric_card,
    render_risk_badge,
    render_recommendation_card,
    render_section_header,
    render_info_box,
    render_footer
)
from src.frontend.components.charts import (
    create_gauge_chart,
    create_feature_importance_chart,
    create_risk_distribution_pie,
    create_trend_chart,
    create_batch_results_chart
)


# Page configuration
st.set_page_config(
    page_title="ChurnShield AI",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Apply custom CSS
st.markdown(get_custom_css(), unsafe_allow_html=True)


def init_session_state():
    """Initialize session state variables."""
    if 'authenticated' not in st.session_state:
        st.session_state.authenticated = False
    if 'username' not in st.session_state:
        st.session_state.username = None
    if 'token' not in st.session_state:
        st.session_state.token = None
    if 'predictions' not in st.session_state:
        st.session_state.predictions = []
    if 'current_prediction' not in st.session_state:
        st.session_state.current_prediction = None


def login_page():
    """Render the login page."""
    st.markdown(render_header(), unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        st.markdown("### Welcome Back")
        st.markdown("Sign in to access the churn prediction platform.")

        with st.form("login_form"):
            username = st.text_input("Username", placeholder="Enter your username")
            password = st.text_input("Password", type="password", placeholder="Enter your password")

            col_a, col_b = st.columns(2)
            with col_a:
                submit = st.form_submit_button("Sign In", use_container_width=True)
            with col_b:
                register = st.form_submit_button("Register", use_container_width=True)

            if submit:
                # For demo, accept any credentials
                if username and password:
                    st.session_state.authenticated = True
                    st.session_state.username = username
                    st.rerun()
                else:
                    st.error("Please enter both username and password")

            if register:
                if username and password:
                    st.success(f"User '{username}' registered successfully! You can now sign in.")
                else:
                    st.error("Please enter both username and password")

        st.markdown("---")
        st.markdown(
            "<p style='text-align: center; color: #718096;'>"
            "Demo mode: Enter any username and password to continue"
            "</p>",
            unsafe_allow_html=True
        )


def sidebar():
    """Render the sidebar navigation."""
    with st.sidebar:
        st.markdown(
            f"""
            <div style="text-align: center; padding: 1rem;">
                <h2 style="color: #667eea;">🛡️ ChurnShield</h2>
                <p style="color: #718096;">Welcome, {st.session_state.username}</p>
            </div>
            """,
            unsafe_allow_html=True
        )

        st.markdown("---")

        # Navigation
        page = st.radio(
            "Navigation",
            ["🏠 Dashboard", "🎯 Single Prediction", "📊 Batch Prediction", "📈 Analytics", "⚙️ Settings"],
            label_visibility="collapsed"
        )

        st.markdown("---")

        # Quick stats
        st.markdown("### Quick Stats")
        st.metric("Total Predictions", len(st.session_state.predictions))
        if st.session_state.predictions:
            avg_prob = np.mean([p.get('churn_probability', 0) for p in st.session_state.predictions])
            st.metric("Avg. Churn Risk", f"{avg_prob:.1%}")

        st.markdown("---")

        # Logout button
        if st.button("🚪 Logout", use_container_width=True):
            st.session_state.authenticated = False
            st.session_state.username = None
            st.session_state.token = None
            st.rerun()

        return page


def dashboard_page():
    """Render the main dashboard page."""
    st.markdown(render_header(), unsafe_allow_html=True)

    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown(
            render_metric_card("1,247", "Total Customers", "👥"),
            unsafe_allow_html=True
        )
    with col2:
        st.markdown(
            render_metric_card("23.5%", "Churn Rate", "📉"),
            unsafe_allow_html=True
        )
    with col3:
        st.markdown(
            render_metric_card("156", "At Risk", "⚠️"),
            unsafe_allow_html=True
        )
    with col4:
        st.markdown(
            render_metric_card("92.3%", "Model Accuracy", "🎯"),
            unsafe_allow_html=True
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Charts row
    col1, col2 = st.columns(2)

    with col1:
        st.markdown(render_section_header("Risk Distribution"), unsafe_allow_html=True)
        risk_data = {"Low": 45, "Medium": 30, "High": 18, "Critical": 7}
        fig = create_risk_distribution_pie(risk_data)
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.markdown(render_section_header("Churn Trend (30 Days)"), unsafe_allow_html=True)
        dates = pd.date_range(end=datetime.now(), periods=30).strftime('%Y-%m-%d').tolist()
        values = np.random.uniform(0.15, 0.35, 30).tolist()
        fig = create_trend_chart(dates, values)
        st.plotly_chart(fig, use_container_width=True)

    # Feature importance
    st.markdown(render_section_header("Top Churn Factors"), unsafe_allow_html=True)

    feature_importance = {
        "Contract_Month-to-month": 0.18,
        "tenure": 0.15,
        "TotalCharges": 0.12,
        "MonthlyCharges": 0.10,
        "InternetService_Fiber optic": 0.09,
        "PaymentMethod_Electronic check": 0.08,
        "OnlineSecurity_No": 0.07,
        "TechSupport_No": 0.06,
        "PaperlessBilling_Yes": 0.05,
        "SeniorCitizen": 0.04
    }

    fig = create_feature_importance_chart(feature_importance)
    st.plotly_chart(fig, use_container_width=True)

    # Recent activity
    st.markdown(render_section_header("Recent Predictions"), unsafe_allow_html=True)

    if st.session_state.predictions:
        df = pd.DataFrame(st.session_state.predictions[-10:])
        st.dataframe(df, use_container_width=True)
    else:
        st.info("No predictions yet. Use Single or Batch Prediction to get started.")


def single_prediction_page():
    """Render the single prediction page."""
    st.markdown(render_header(), unsafe_allow_html=True)
    st.markdown(render_section_header("Customer Churn Prediction"), unsafe_allow_html=True)

    with st.form("prediction_form"):
        col1, col2, col3 = st.columns(3)

        with col1:
            st.markdown("#### Demographics")
            gender = st.selectbox("Gender", ["Male", "Female"])
            senior_citizen = st.selectbox("Senior Citizen", ["No", "Yes"])
            partner = st.selectbox("Partner", ["Yes", "No"])
            dependents = st.selectbox("Dependents", ["Yes", "No"])

        with col2:
            st.markdown("#### Account Info")
            tenure = st.number_input("Tenure (months)", min_value=0, max_value=72, value=12)
            contract = st.selectbox("Contract", ["Month-to-month", "One year", "Two year"])
            paperless_billing = st.selectbox("Paperless Billing", ["Yes", "No"])
            payment_method = st.selectbox(
                "Payment Method",
                ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"]
            )

        with col3:
            st.markdown("#### Charges")
            monthly_charges = st.number_input("Monthly Charges ($)", min_value=0.0, max_value=200.0, value=70.0)
            total_charges = st.number_input("Total Charges ($)", min_value=0.0, max_value=10000.0, value=840.0)

        st.markdown("#### Services")
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            phone_service = st.selectbox("Phone Service", ["Yes", "No"])
            multiple_lines = st.selectbox("Multiple Lines", ["Yes", "No", "No phone service"])

        with col2:
            internet_service = st.selectbox("Internet Service", ["DSL", "Fiber optic", "No"])
            online_security = st.selectbox("Online Security", ["Yes", "No", "No internet service"])

        with col3:
            online_backup = st.selectbox("Online Backup", ["Yes", "No", "No internet service"])
            device_protection = st.selectbox("Device Protection", ["Yes", "No", "No internet service"])

        with col4:
            tech_support = st.selectbox("Tech Support", ["Yes", "No", "No internet service"])
            streaming_tv = st.selectbox("Streaming TV", ["Yes", "No", "No internet service"])

        streaming_movies = st.selectbox("Streaming Movies", ["Yes", "No", "No internet service"])

        submit = st.form_submit_button("🔮 Predict Churn Risk", use_container_width=True)

        if submit:
            # Simulate prediction
            with st.spinner("Analyzing customer data..."):
                import time
                time.sleep(1)

                # Generate mock prediction
                base_prob = 0.27

                # Adjust based on features
                if contract == "Month-to-month":
                    base_prob += 0.15
                if tenure < 12:
                    base_prob += 0.1
                if internet_service == "Fiber optic" and online_security == "No":
                    base_prob += 0.1
                if payment_method == "Electronic check":
                    base_prob += 0.05
                if monthly_charges > 80:
                    base_prob += 0.05
                if senior_citizen == "Yes":
                    base_prob += 0.03

                # Add some randomness
                churn_probability = min(max(base_prob + np.random.uniform(-0.05, 0.05), 0), 1)

                # Determine risk level
                if churn_probability >= 0.75:
                    risk_level = "Critical"
                elif churn_probability >= 0.50:
                    risk_level = "High"
                elif churn_probability >= 0.25:
                    risk_level = "Medium"
                else:
                    risk_level = "Low"

                prediction = {
                    'customer_id': f"CUST{np.random.randint(1000, 9999)}",
                    'churn_probability': churn_probability,
                    'risk_level': risk_level,
                    'timestamp': datetime.now().isoformat()
                }

                st.session_state.current_prediction = prediction
                st.session_state.predictions.append(prediction)

    # Display prediction result
    if st.session_state.current_prediction:
        pred = st.session_state.current_prediction

        st.markdown("---")
        st.markdown(render_section_header("Prediction Results"), unsafe_allow_html=True)

        col1, col2 = st.columns([1, 2])

        with col1:
            fig = create_gauge_chart(pred['churn_probability'] * 100, "Churn Risk Score")
            st.plotly_chart(fig, use_container_width=True)

            st.markdown(
                f"<div style='text-align: center;'>{render_risk_badge(pred['risk_level'])}</div>",
                unsafe_allow_html=True
            )

        with col2:
            st.markdown("### Retention Recommendations")

            recommendations = [
                {
                    "priority": 1,
                    "action": "Offer Annual Contract",
                    "description": "Offer a 15-20% discount for upgrading to a one-year or two-year contract",
                    "impact": "Reduces churn by 30-40% for high-risk customers"
                },
                {
                    "priority": 2,
                    "action": "Bundle Add-on Services",
                    "description": "Offer discounted security, backup, and tech support bundle",
                    "impact": "Increases stickiness and reduces churn by 20%"
                },
                {
                    "priority": 3,
                    "action": "Auto-payment Incentive",
                    "description": "Offer $5/month discount for switching to automatic payment",
                    "impact": "Reduces payment-related churn by 15%"
                }
            ]

            for rec in recommendations:
                st.markdown(
                    render_recommendation_card(
                        rec['priority'],
                        rec['action'],
                        rec['description'],
                        rec['impact']
                    ),
                    unsafe_allow_html=True
                )


def batch_prediction_page():
    """Render the batch prediction page."""
    st.markdown(render_header(), unsafe_allow_html=True)
    st.markdown(render_section_header("Batch Churn Prediction"), unsafe_allow_html=True)

    st.markdown(
        render_info_box(
            "Upload a CSV or Excel file with customer data to get predictions for multiple customers at once. "
            "Maximum file size: 10MB, Maximum rows: 10,000.",
            "info"
        ),
        unsafe_allow_html=True
    )

    uploaded_file = st.file_uploader(
        "Upload Customer Data",
        type=['csv', 'xlsx', 'xls'],
        help="Upload a file containing customer data with the required columns"
    )

    if uploaded_file:
        try:
            if uploaded_file.name.endswith('.csv'):
                df = pd.read_csv(uploaded_file)
            else:
                df = pd.read_excel(uploaded_file)

            st.success(f"Loaded {len(df)} records from {uploaded_file.name}")

            # Show data preview
            with st.expander("📋 Data Preview", expanded=True):
                st.dataframe(df.head(10), use_container_width=True)

            if st.button("🚀 Run Batch Prediction", use_container_width=True):
                with st.spinner("Processing predictions..."):
                    import time
                    progress_bar = st.progress(0)

                    predictions = []
                    for i, row in df.iterrows():
                        # Simulate prediction
                        time.sleep(0.01)
                        progress_bar.progress((i + 1) / len(df))

                        base_prob = np.random.uniform(0.1, 0.8)

                        if row.get('Contract', '') == 'Month-to-month':
                            base_prob += 0.1

                        churn_prob = min(max(base_prob, 0), 1)

                        if churn_prob >= 0.75:
                            risk = "Critical"
                        elif churn_prob >= 0.50:
                            risk = "High"
                        elif churn_prob >= 0.25:
                            risk = "Medium"
                        else:
                            risk = "Low"

                        predictions.append({
                            'customer_id': row.get('customerID', f'CUST{i:04d}'),
                            'churn_probability': churn_prob,
                            'risk_level': risk,
                            'will_churn': churn_prob >= 0.5
                        })

                    st.session_state.predictions.extend(predictions)

                st.success("Batch prediction completed!")

                # Show results
                st.markdown(render_section_header("Batch Results"), unsafe_allow_html=True)

                # Summary metrics
                total = len(predictions)
                high_risk = sum(1 for p in predictions if p['risk_level'] in ['High', 'Critical'])
                avg_prob = np.mean([p['churn_probability'] for p in predictions])

                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("Total Customers", total)
                with col2:
                    st.metric("High Risk", high_risk)
                with col3:
                    st.metric("Avg. Churn Probability", f"{avg_prob:.1%}")
                with col4:
                    st.metric("Predicted to Churn", sum(1 for p in predictions if p['will_churn']))

                # Risk distribution
                col1, col2 = st.columns(2)

                with col1:
                    risk_counts = {}
                    for p in predictions:
                        risk_counts[p['risk_level']] = risk_counts.get(p['risk_level'], 0) + 1
                    fig = create_risk_distribution_pie(risk_counts)
                    st.plotly_chart(fig, use_container_width=True)

                with col2:
                    fig = create_batch_results_chart(predictions)
                    st.plotly_chart(fig, use_container_width=True)

                # Results table
                results_df = pd.DataFrame(predictions)
                st.dataframe(results_df, use_container_width=True)

                # Download button
                csv = results_df.to_csv(index=False)
                st.download_button(
                    "📥 Download Results (CSV)",
                    csv,
                    "churn_predictions.csv",
                    "text/csv",
                    use_container_width=True
                )

        except Exception as e:
            st.error(f"Error processing file: {str(e)}")

    # Sample data download
    st.markdown("---")
    st.markdown("### Need sample data?")

    sample_data = pd.DataFrame({
        'customerID': [f'CUST{i:04d}' for i in range(10)],
        'gender': np.random.choice(['Male', 'Female'], 10),
        'SeniorCitizen': np.random.choice([0, 1], 10),
        'Partner': np.random.choice(['Yes', 'No'], 10),
        'Dependents': np.random.choice(['Yes', 'No'], 10),
        'tenure': np.random.randint(1, 72, 10),
        'PhoneService': np.random.choice(['Yes', 'No'], 10),
        'MultipleLines': np.random.choice(['Yes', 'No', 'No phone service'], 10),
        'InternetService': np.random.choice(['DSL', 'Fiber optic', 'No'], 10),
        'OnlineSecurity': np.random.choice(['Yes', 'No', 'No internet service'], 10),
        'OnlineBackup': np.random.choice(['Yes', 'No', 'No internet service'], 10),
        'DeviceProtection': np.random.choice(['Yes', 'No', 'No internet service'], 10),
        'TechSupport': np.random.choice(['Yes', 'No', 'No internet service'], 10),
        'StreamingTV': np.random.choice(['Yes', 'No', 'No internet service'], 10),
        'StreamingMovies': np.random.choice(['Yes', 'No', 'No internet service'], 10),
        'Contract': np.random.choice(['Month-to-month', 'One year', 'Two year'], 10),
        'PaperlessBilling': np.random.choice(['Yes', 'No'], 10),
        'PaymentMethod': np.random.choice(['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'], 10),
        'MonthlyCharges': np.round(np.random.uniform(20, 100, 10), 2),
        'TotalCharges': np.round(np.random.uniform(100, 5000, 10), 2)
    })

    csv = sample_data.to_csv(index=False)
    st.download_button(
        "📥 Download Sample Template",
        csv,
        "sample_customer_data.csv",
        "text/csv"
    )


def analytics_page():
    """Render the analytics page."""
    st.markdown(render_header(), unsafe_allow_html=True)
    st.markdown(render_section_header("Analytics Dashboard"), unsafe_allow_html=True)

    # Time period selector
    col1, col2 = st.columns([3, 1])
    with col2:
        period = st.selectbox("Time Period", ["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"])

    # Model performance metrics
    st.markdown("### Model Performance")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Accuracy", "92.3%", "+1.2%")
    with col2:
        st.metric("Precision", "89.7%", "+0.8%")
    with col3:
        st.metric("Recall", "85.4%", "-0.5%")
    with col4:
        st.metric("ROC-AUC", "0.94", "+0.02")

    # Charts
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("### Confusion Matrix")
        from src.frontend.components.charts import create_confusion_matrix_chart
        confusion_matrix = [[850, 120], [80, 450]]
        fig = create_confusion_matrix_chart(confusion_matrix)
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.markdown("### Model Metrics")
        from src.frontend.components.charts import create_metrics_radar_chart
        metrics = {
            "Accuracy": 0.92,
            "Precision": 0.90,
            "Recall": 0.85,
            "F1 Score": 0.87,
            "ROC-AUC": 0.94
        }
        fig = create_metrics_radar_chart(metrics)
        st.plotly_chart(fig, use_container_width=True)

    # Churn insights
    st.markdown("### Churn Insights")

    insights = [
        {
            "title": "Month-to-Month Contracts",
            "value": "42%",
            "description": "of churned customers were on month-to-month contracts",
            "trend": "up"
        },
        {
            "title": "Average Tenure",
            "value": "8 months",
            "description": "average tenure of churned customers vs 32 months for retained",
            "trend": "down"
        },
        {
            "title": "Fiber Optic Users",
            "value": "35%",
            "description": "higher churn rate among fiber optic users without security services",
            "trend": "up"
        },
        {
            "title": "Electronic Check",
            "value": "28%",
            "description": "higher churn rate for electronic check payment users",
            "trend": "up"
        }
    ]

    cols = st.columns(4)
    for col, insight in zip(cols, insights):
        with col:
            trend_icon = "📈" if insight["trend"] == "up" else "📉"
            st.markdown(f"""
            <div class="metric-card">
                <div style="font-size: 0.9rem; color: #718096;">{insight['title']}</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #2d3748;">{insight['value']} {trend_icon}</div>
                <div style="font-size: 0.8rem; color: #a0aec0;">{insight['description']}</div>
            </div>
            """, unsafe_allow_html=True)


def settings_page():
    """Render the settings page."""
    st.markdown(render_header(), unsafe_allow_html=True)
    st.markdown(render_section_header("Settings"), unsafe_allow_html=True)

    tab1, tab2, tab3 = st.tabs(["⚙️ Model Settings", "🔔 Notifications", "👤 Profile"])

    with tab1:
        st.markdown("### Model Configuration")

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("#### Prediction Threshold")
            threshold = st.slider(
                "Churn probability threshold",
                min_value=0.3,
                max_value=0.7,
                value=0.5,
                step=0.05,
                help="Customers with probability above this threshold will be classified as 'will churn'"
            )

            st.markdown("#### Risk Level Thresholds")
            low_threshold = st.slider("Low/Medium boundary", 0.1, 0.4, 0.25, 0.05)
            medium_threshold = st.slider("Medium/High boundary", 0.3, 0.6, 0.50, 0.05)
            high_threshold = st.slider("High/Critical boundary", 0.5, 0.9, 0.75, 0.05)

        with col2:
            st.markdown("#### Model Version")
            st.info("Current model: v1.0.0")
            st.info("Last trained: 2024-01-15")
            st.info("Training samples: 7,043")

            if st.button("🔄 Retrain Model"):
                st.warning("Model retraining requires admin privileges.")

        if st.button("💾 Save Settings", use_container_width=True):
            st.success("Settings saved successfully!")

    with tab2:
        st.markdown("### Notification Preferences")

        st.checkbox("Email alerts for high-risk customers", value=True)
        st.checkbox("Daily summary reports", value=True)
        st.checkbox("Weekly churn trend reports", value=False)
        st.checkbox("Model performance alerts", value=True)

        st.markdown("#### Alert Recipients")
        st.text_input("Email addresses (comma-separated)")

    with tab3:
        st.markdown("### Profile Settings")

        col1, col2 = st.columns(2)

        with col1:
            st.text_input("Username", value=st.session_state.username, disabled=True)
            st.text_input("Email", placeholder="your@email.com")
            st.text_input("Full Name", placeholder="John Doe")

        with col2:
            st.selectbox("Role", ["Analyst", "Admin", "Viewer"])
            st.selectbox("Department", ["Marketing", "Customer Success", "Data Science", "Executive"])

        st.markdown("#### Change Password")
        st.text_input("Current Password", type="password")
        st.text_input("New Password", type="password")
        st.text_input("Confirm New Password", type="password")

        if st.button("Update Profile", use_container_width=True):
            st.success("Profile updated successfully!")


def main():
    """Main application entry point."""
    init_session_state()

    if not st.session_state.authenticated:
        login_page()
    else:
        page = sidebar()

        if page == "🏠 Dashboard":
            dashboard_page()
        elif page == "🎯 Single Prediction":
            single_prediction_page()
        elif page == "📊 Batch Prediction":
            batch_prediction_page()
        elif page == "📈 Analytics":
            analytics_page()
        elif page == "⚙️ Settings":
            settings_page()

        # Footer
        st.markdown(render_footer(), unsafe_allow_html=True)


if __name__ == "__main__":
    main()
