#!/usr/bin/env python3
"""
All Stores Analysis Module
Analyze all stores found in Nash CSV data (CA stores only).
"""

import pandas as pd
import json
import sys
from typing import Dict, Any, List
from . import load_nash_data, filter_ca_stores
from .store_analysis import analyze_store


def analyze_all_stores(
    nash_df: pd.DataFrame,
    store_registry: Dict[str, Any],
    rate_cards: Dict[str, Any]
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Analyze all CA stores found in Nash data.

    Args:
        nash_df: DataFrame with Nash trip data
        store_registry: Store registry with Spark CPD data
        rate_cards: Rate cards for vendors

    Returns:
        dict: { stores: [array of store metrics] }
    """
    # Filter to CA stores only
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {"stores": []}

    # Get unique CA store IDs
    unique_stores = ca_df['Store Id'].unique()

    # Analyze each store
    stores_data = []
    for store_id in unique_stores:
        store_metrics = analyze_store(
            str(store_id),
            nash_df,  # Pass full dataframe
            store_registry,
            rate_cards
        )
        stores_data.append(store_metrics)

    return {"stores": stores_data}


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)

    nash_path = sys.argv[1]
    registry_path = sys.argv[2]
    rates_path = sys.argv[3]

    # Load data
    nash_df = load_nash_data(nash_path)

    with open(registry_path, 'r') as f:
        store_registry = json.load(f)

    with open(rates_path, 'r') as f:
        rate_cards = json.load(f)

    # Calculate metrics
    result = analyze_all_stores(nash_df, store_registry, rate_cards)

    # Print JSON output
    print(json.dumps(result))
