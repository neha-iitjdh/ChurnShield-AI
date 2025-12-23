#!/usr/bin/env python
"""Script to train the ML model."""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ml.train import main

if __name__ == "__main__":
    main()
