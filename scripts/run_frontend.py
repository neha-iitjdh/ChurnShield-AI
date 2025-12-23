#!/usr/bin/env python
"""Script to run the Streamlit frontend."""
import subprocess
import sys
from pathlib import Path

# Get the project root
project_root = Path(__file__).parent.parent
app_path = project_root / "src" / "frontend" / "app.py"

if __name__ == "__main__":
    subprocess.run([
        sys.executable, "-m", "streamlit", "run",
        str(app_path),
        "--server.port=8501",
        "--server.address=localhost",
        "--theme.primaryColor=#667eea",
        "--theme.backgroundColor=#ffffff",
        "--theme.secondaryBackgroundColor=#f7fafc",
        "--theme.textColor=#2d3748"
    ])
