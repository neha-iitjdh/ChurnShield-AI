#!/usr/bin/env python
"""Script to run the FastAPI server."""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.api.main import run_server

if __name__ == "__main__":
    run_server()
