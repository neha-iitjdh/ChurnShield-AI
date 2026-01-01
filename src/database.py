"""
Database module for ChurnShield AI - Prediction History

Uses SQLite for simplicity (works on Render free tier).
Stores prediction history for analytics and tracking.
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Optional
import os

# Database file path
DB_PATH = os.environ.get('DATABASE_PATH', 'predictions.db')


def get_connection():
    """Get database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT,
            customer_data TEXT,
            churn_probability REAL,
            risk_level TEXT,
            will_churn INTEGER,
            prediction_type TEXT DEFAULT 'single',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized")


def save_prediction(
    customer_data: dict,
    churn_probability: float,
    risk_level: str,
    will_churn: bool,
    customer_id: Optional[str] = None,
    prediction_type: str = 'single'
) -> int:
    """
    Save a prediction to history.

    Returns the prediction ID.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO predictions
        (customer_id, customer_data, churn_probability, risk_level, will_churn, prediction_type)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        customer_id,
        json.dumps(customer_data),
        churn_probability,
        risk_level,
        1 if will_churn else 0,
        prediction_type
    ))

    prediction_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return prediction_id


def get_predictions(limit: int = 50, offset: int = 0) -> List[dict]:
    """Get prediction history with pagination."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM predictions
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ''', (limit, offset))

    rows = cursor.fetchall()
    conn.close()

    predictions = []
    for row in rows:
        predictions.append({
            'id': row['id'],
            'customer_id': row['customer_id'],
            'customer_data': json.loads(row['customer_data']),
            'churn_probability': row['churn_probability'],
            'risk_level': row['risk_level'],
            'will_churn': bool(row['will_churn']),
            'prediction_type': row['prediction_type'],
            'created_at': row['created_at']
        })

    return predictions


def get_prediction_stats() -> dict:
    """Get summary statistics for all predictions."""
    conn = get_connection()
    cursor = conn.cursor()

    # Total predictions
    cursor.execute('SELECT COUNT(*) as total FROM predictions')
    total = cursor.fetchone()['total']

    # Churn rate
    cursor.execute('SELECT AVG(will_churn) * 100 as churn_rate FROM predictions')
    result = cursor.fetchone()
    churn_rate = round(result['churn_rate'], 2) if result['churn_rate'] else 0

    # Average probability
    cursor.execute('SELECT AVG(churn_probability) as avg_prob FROM predictions')
    result = cursor.fetchone()
    avg_probability = round(result['avg_prob'], 2) if result['avg_prob'] else 0

    # Risk distribution
    cursor.execute('''
        SELECT risk_level, COUNT(*) as count
        FROM predictions
        GROUP BY risk_level
    ''')
    risk_dist = {row['risk_level']: row['count'] for row in cursor.fetchall()}

    # Recent trend (last 7 days)
    cursor.execute('''
        SELECT DATE(created_at) as date,
               COUNT(*) as count,
               AVG(churn_probability) as avg_prob
        FROM predictions
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date
    ''')
    trend = [{'date': row['date'], 'count': row['count'], 'avg_prob': round(row['avg_prob'], 2)}
             for row in cursor.fetchall()]

    conn.close()

    return {
        'total_predictions': total,
        'overall_churn_rate': churn_rate,
        'average_probability': avg_probability,
        'risk_distribution': risk_dist,
        'recent_trend': trend
    }


def delete_prediction(prediction_id: int) -> bool:
    """Delete a prediction by ID."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM predictions WHERE id = ?', (prediction_id,))
    deleted = cursor.rowcount > 0

    conn.commit()
    conn.close()

    return deleted


def clear_history() -> int:
    """Clear all prediction history. Returns count of deleted records."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) as count FROM predictions')
    count = cursor.fetchone()['count']

    cursor.execute('DELETE FROM predictions')

    conn.commit()
    conn.close()

    return count


# Initialize database on import
init_db()
