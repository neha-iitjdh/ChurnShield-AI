"""
Plotly chart components for the dashboard.
"""
from typing import Dict, List, Any, Optional

import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np


# Color palette
COLORS = {
    "primary": "#667eea",
    "secondary": "#764ba2",
    "success": "#48bb78",
    "warning": "#ed8936",
    "danger": "#f56565",
    "info": "#4299e1",
    "dark": "#2d3748",
    "light": "#edf2f7",
    "gradient": ["#667eea", "#764ba2"]
}

RISK_COLORS = {
    "Low": "#48bb78",
    "Medium": "#ed8936",
    "High": "#f56565",
    "Critical": "#c53030"
}


def create_gauge_chart(
    value: float,
    title: str = "Churn Risk",
    max_value: float = 100
) -> go.Figure:
    """
    Create a gauge chart for displaying risk score.

    Args:
        value: Current value
        title: Chart title
        max_value: Maximum value

    Returns:
        Plotly figure
    """
    # Determine color based on value
    if value < 25:
        bar_color = RISK_COLORS["Low"]
    elif value < 50:
        bar_color = RISK_COLORS["Medium"]
    elif value < 75:
        bar_color = RISK_COLORS["High"]
    else:
        bar_color = RISK_COLORS["Critical"]

    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=value,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': title, 'font': {'size': 20, 'color': COLORS["dark"]}},
        number={'suffix': '%', 'font': {'size': 40, 'color': COLORS["dark"]}},
        gauge={
            'axis': {'range': [0, max_value], 'tickwidth': 1, 'tickcolor': COLORS["dark"]},
            'bar': {'color': bar_color},
            'bgcolor': "white",
            'borderwidth': 2,
            'bordercolor': COLORS["light"],
            'steps': [
                {'range': [0, 25], 'color': 'rgba(72, 187, 120, 0.3)'},
                {'range': [25, 50], 'color': 'rgba(237, 137, 54, 0.3)'},
                {'range': [50, 75], 'color': 'rgba(245, 101, 101, 0.3)'},
                {'range': [75, 100], 'color': 'rgba(197, 48, 48, 0.3)'}
            ],
            'threshold': {
                'line': {'color': COLORS["dark"], 'width': 4},
                'thickness': 0.75,
                'value': value
            }
        }
    ))

    fig.update_layout(
        height=300,
        margin=dict(l=30, r=30, t=50, b=30),
        paper_bgcolor='rgba(0,0,0,0)',
        font={'color': COLORS["dark"]}
    )

    return fig


def create_feature_importance_chart(
    feature_importance: Dict[str, float],
    top_n: int = 10
) -> go.Figure:
    """
    Create a horizontal bar chart for feature importance.

    Args:
        feature_importance: Dictionary of feature names to importance scores
        top_n: Number of top features to display

    Returns:
        Plotly figure
    """
    # Sort and get top N
    sorted_features = sorted(
        feature_importance.items(),
        key=lambda x: x[1],
        reverse=True
    )[:top_n]

    features = [f[0] for f in sorted_features][::-1]
    importances = [f[1] for f in sorted_features][::-1]

    # Create color gradient
    colors = px.colors.sequential.Purples[3:3+len(features)]

    fig = go.Figure(go.Bar(
        x=importances,
        y=features,
        orientation='h',
        marker=dict(
            color=importances,
            colorscale='Purples',
            line=dict(color=COLORS["primary"], width=1)
        ),
        text=[f'{v:.1%}' for v in importances],
        textposition='outside'
    ))

    fig.update_layout(
        title={
            'text': 'Top Churn Risk Factors',
            'y': 0.95,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top',
            'font': {'size': 18, 'color': COLORS["dark"]}
        },
        xaxis_title='Importance Score',
        yaxis_title='',
        height=400,
        margin=dict(l=150, r=50, t=60, b=50),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        xaxis=dict(showgrid=True, gridcolor='rgba(0,0,0,0.1)'),
        yaxis=dict(showgrid=False)
    )

    return fig


def create_risk_distribution_pie(
    risk_counts: Dict[str, int]
) -> go.Figure:
    """
    Create a pie chart for risk distribution.

    Args:
        risk_counts: Dictionary of risk levels to counts

    Returns:
        Plotly figure
    """
    labels = list(risk_counts.keys())
    values = list(risk_counts.values())

    colors = [RISK_COLORS.get(label, COLORS["info"]) for label in labels]

    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        hole=0.5,
        marker=dict(colors=colors, line=dict(color='white', width=2)),
        textinfo='label+percent',
        textfont=dict(size=12),
        hovertemplate="<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>"
    )])

    fig.update_layout(
        title={
            'text': 'Risk Distribution',
            'y': 0.95,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top',
            'font': {'size': 18, 'color': COLORS["dark"]}
        },
        height=350,
        margin=dict(l=30, r=30, t=60, b=30),
        paper_bgcolor='rgba(0,0,0,0)',
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.15,
            xanchor="center",
            x=0.5
        )
    )

    return fig


def create_trend_chart(
    dates: List[str],
    values: List[float],
    title: str = "Churn Probability Trend"
) -> go.Figure:
    """
    Create a line chart for trends over time.

    Args:
        dates: List of date strings
        values: List of values
        title: Chart title

    Returns:
        Plotly figure
    """
    fig = go.Figure()

    # Add area fill
    fig.add_trace(go.Scatter(
        x=dates,
        y=values,
        fill='tozeroy',
        fillcolor='rgba(102, 126, 234, 0.2)',
        line=dict(color=COLORS["primary"], width=3),
        mode='lines+markers',
        marker=dict(size=8, color=COLORS["primary"]),
        hovertemplate="Date: %{x}<br>Probability: %{y:.1%}<extra></extra>"
    ))

    # Add threshold line
    fig.add_hline(
        y=0.5,
        line_dash="dash",
        line_color=COLORS["danger"],
        annotation_text="High Risk Threshold",
        annotation_position="bottom right"
    )

    fig.update_layout(
        title={
            'text': title,
            'y': 0.95,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top',
            'font': {'size': 18, 'color': COLORS["dark"]}
        },
        xaxis_title='Date',
        yaxis_title='Average Churn Probability',
        height=350,
        margin=dict(l=50, r=30, t=60, b=50),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        xaxis=dict(showgrid=True, gridcolor='rgba(0,0,0,0.1)'),
        yaxis=dict(
            showgrid=True,
            gridcolor='rgba(0,0,0,0.1)',
            tickformat='.0%',
            range=[0, 1]
        ),
        hovermode='x unified'
    )

    return fig


def create_confusion_matrix_chart(
    confusion_matrix: List[List[int]]
) -> go.Figure:
    """
    Create a heatmap visualization of confusion matrix.

    Args:
        confusion_matrix: 2x2 confusion matrix

    Returns:
        Plotly figure
    """
    labels = ['Retained', 'Churned']
    z = confusion_matrix

    # Calculate percentages
    total = sum(sum(row) for row in z)
    z_text = [[f'{val}<br>({val/total*100:.1f}%)' for val in row] for row in z]

    fig = go.Figure(data=go.Heatmap(
        z=z,
        x=labels,
        y=labels,
        text=z_text,
        texttemplate="%{text}",
        textfont={"size": 16},
        colorscale='Purples',
        showscale=True,
        hovertemplate="Actual: %{y}<br>Predicted: %{x}<br>Count: %{z}<extra></extra>"
    ))

    fig.update_layout(
        title={
            'text': 'Confusion Matrix',
            'y': 0.95,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top',
            'font': {'size': 18, 'color': COLORS["dark"]}
        },
        xaxis_title='Predicted',
        yaxis_title='Actual',
        height=350,
        margin=dict(l=50, r=30, t=60, b=50),
        paper_bgcolor='rgba(0,0,0,0)'
    )

    return fig


def create_metrics_radar_chart(
    metrics: Dict[str, float]
) -> go.Figure:
    """
    Create a radar chart for model metrics.

    Args:
        metrics: Dictionary of metric names to values

    Returns:
        Plotly figure
    """
    categories = list(metrics.keys())
    values = list(metrics.values())

    # Close the radar chart
    categories = categories + [categories[0]]
    values = values + [values[0]]

    fig = go.Figure()

    fig.add_trace(go.Scatterpolar(
        r=values,
        theta=categories,
        fill='toself',
        fillcolor='rgba(102, 126, 234, 0.3)',
        line=dict(color=COLORS["primary"], width=2),
        marker=dict(size=8, color=COLORS["primary"])
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, 1],
                tickformat='.0%'
            )
        ),
        title={
            'text': 'Model Performance Metrics',
            'y': 0.95,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top',
            'font': {'size': 18, 'color': COLORS["dark"]}
        },
        height=400,
        margin=dict(l=80, r=80, t=60, b=50),
        paper_bgcolor='rgba(0,0,0,0)',
        showlegend=False
    )

    return fig


def create_batch_results_chart(
    predictions: List[Dict[str, Any]]
) -> go.Figure:
    """
    Create a scatter plot of batch prediction results.

    Args:
        predictions: List of prediction results

    Returns:
        Plotly figure
    """
    df = pd.DataFrame(predictions)

    fig = px.scatter(
        df,
        x=range(len(df)),
        y='churn_probability',
        color='risk_level',
        color_discrete_map=RISK_COLORS,
        hover_data=['customer_id'],
        title='Batch Prediction Results'
    )

    fig.add_hline(
        y=0.5,
        line_dash="dash",
        line_color=COLORS["danger"],
        annotation_text="Threshold"
    )

    fig.update_layout(
        xaxis_title='Customer Index',
        yaxis_title='Churn Probability',
        height=400,
        margin=dict(l=50, r=30, t=60, b=50),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        yaxis=dict(tickformat='.0%', range=[0, 1])
    )

    return fig


def create_customer_comparison_chart(
    current_customer: Dict[str, Any],
    averages: Dict[str, float]
) -> go.Figure:
    """
    Create a comparison chart between customer and average values.

    Args:
        current_customer: Current customer data
        averages: Average values for comparison

    Returns:
        Plotly figure
    """
    metrics = ['tenure', 'MonthlyCharges', 'TotalCharges']
    customer_values = [current_customer.get(m, 0) for m in metrics]
    avg_values = [averages.get(m, 0) for m in metrics]

    fig = go.Figure()

    fig.add_trace(go.Bar(
        name='This Customer',
        x=metrics,
        y=customer_values,
        marker_color=COLORS["primary"]
    ))

    fig.add_trace(go.Bar(
        name='Average',
        x=metrics,
        y=avg_values,
        marker_color=COLORS["light"]
    ))

    fig.update_layout(
        title={
            'text': 'Customer vs Average Comparison',
            'y': 0.95,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top',
            'font': {'size': 18, 'color': COLORS["dark"]}
        },
        barmode='group',
        height=350,
        margin=dict(l=50, r=30, t=60, b=50),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.2,
            xanchor="center",
            x=0.5
        )
    )

    return fig
