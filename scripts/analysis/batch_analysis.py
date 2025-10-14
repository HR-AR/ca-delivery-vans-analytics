#!/usr/bin/env python3
"""
Batch Density Analysis Module
Analyze batch sizes and efficiency.
"""

import pandas as pd
from typing import Dict, Any
from . import (
    filter_ca_stores,
    safe_mean,
    safe_sum
)


def analyze_batch_density(
    nash_df: pd.DataFrame,
    store_registry: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Analyze batch sizes vs targets.

    Args:
        nash_df: DataFrame with Nash trip data
        store_registry: Store registry with target batch sizes

    Returns:
        dict: Batch analysis with store-level and overall metrics
    """
    # Filter to CA stores
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {
            "stores": {},
            "overall": {
                "avg_batch_size": 0.0,
                "avg_target": 0.0,
                "achievement": 0.0
            }
        }

    # Analyze each store
    store_batch_data = {}
    all_batch_sizes = []
    all_targets = []
    all_achievements = []

    for store_id in ca_df['Store Id'].unique():
        store_df = ca_df[ca_df['Store Id'] == str(store_id)]

        # Calculate average batch size
        avg_batch_size = safe_mean(store_df['Total Orders'])
        total_batches = len(store_df)

        # Get target from store registry
        store_data = store_registry.get('stores', {}).get(str(store_id), {})
        target_batch_size = store_data.get('target_batch_size', 90)  # Default 90

        # Calculate achievement percentage
        achievement = (avg_batch_size / target_batch_size * 100) if target_batch_size > 0 else 0.0

        store_batch_data[str(store_id)] = {
            "avg_batch_size": round(avg_batch_size, 1),
            "target_batch_size": target_batch_size,
            "achievement": round(achievement, 1),
            "total_batches": total_batches
        }

        all_batch_sizes.append(avg_batch_size)
        all_targets.append(target_batch_size)
        all_achievements.append(achievement)

    # Calculate overall metrics
    overall = {
        "avg_batch_size": round(sum(all_batch_sizes) / len(all_batch_sizes), 1) if all_batch_sizes else 0.0,
        "avg_target": round(sum(all_targets) / len(all_targets), 1) if all_targets else 0.0,
        "achievement": round(sum(all_achievements) / len(all_achievements), 1) if all_achievements else 0.0
    }

    return {
        "stores": store_batch_data,
        "overall": overall
    }


def identify_underperforming_stores(
    nash_df: pd.DataFrame,
    store_registry: Dict[str, Any],
    threshold: float = 90.0
) -> Dict[str, Any]:
    """
    Identify stores with batch achievement below threshold.

    Args:
        nash_df: DataFrame with Nash trip data
        store_registry: Store registry with target batch sizes
        threshold: Achievement percentage threshold (default 90%)

    Returns:
        dict: List of underperforming stores with details
    """
    batch_analysis = analyze_batch_density(nash_df, store_registry)
    stores_data = batch_analysis.get('stores', {})

    underperforming = {}

    for store_id, data in stores_data.items():
        if data['achievement'] < threshold:
            underperforming[store_id] = {
                "avg_batch_size": data['avg_batch_size'],
                "target_batch_size": data['target_batch_size'],
                "achievement": data['achievement'],
                "gap": round(data['target_batch_size'] - data['avg_batch_size'], 1)
            }

    return {
        "threshold": threshold,
        "underperforming_count": len(underperforming),
        "stores": underperforming
    }


def get_trip_level_batch_data(
    nash_df: pd.DataFrame,
    rate_cards: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Get trip-level batch data for scatter plot visualization.
    Each trip becomes a point on the chart (batch_size vs CPD).

    Args:
        nash_df: DataFrame with Nash trip data
        rate_cards: Rate cards for CPD calculation

    Returns:
        dict: { batches: [{carrier, batch_size, cpd}, ...] }
    """
    from .cpd_analysis import calculate_van_cpd
    from . import normalize_carrier_name

    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {"batches": []}

    # Normalize carrier names
    ca_df['Carrier_Normalized'] = ca_df['Carrier'].apply(normalize_carrier_name)

    batches = []

    for _, row in ca_df.iterrows():
        carrier = row['Carrier_Normalized']
        batch_size = row.get('Total Orders', 0)

        if pd.isna(batch_size) or batch_size == 0:
            continue

        # Calculate CPD for this trip
        vendor_rates = rate_cards.get('vendors', {}).get(carrier)
        if not vendor_rates:
            continue

        trip_cpd = calculate_van_cpd(
            trip_data=row.to_dict(),
            rate_card=vendor_rates,
            batch_size=int(batch_size)
        )

        batches.append({
            "carrier": carrier,
            "batch_size": int(batch_size),
            "cpd": round(trip_cpd, 2)
        })

    return {"batches": batches}


def batch_size_distribution(nash_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyze distribution of batch sizes.

    Args:
        nash_df: DataFrame with Nash trip data

    Returns:
        dict: Batch size distribution statistics
    """
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty or 'Total Orders' not in ca_df.columns:
        return {
            "min": 0,
            "max": 0,
            "mean": 0.0,
            "median": 0.0,
            "std_dev": 0.0,
            "ranges": {}
        }

    batch_sizes = ca_df['Total Orders'].dropna()

    if batch_sizes.empty:
        return {
            "min": 0,
            "max": 0,
            "mean": 0.0,
            "median": 0.0,
            "std_dev": 0.0,
            "ranges": {}
        }

    # Calculate statistics
    stats = {
        "min": int(batch_sizes.min()),
        "max": int(batch_sizes.max()),
        "mean": round(batch_sizes.mean(), 1),
        "median": round(batch_sizes.median(), 1),
        "std_dev": round(batch_sizes.std(), 1)
    }

    # Calculate distribution ranges
    ranges = {
        "0-50": int(len(batch_sizes[batch_sizes < 50])),
        "50-80": int(len(batch_sizes[(batch_sizes >= 50) & (batch_sizes < 80)])),
        "80-100": int(len(batch_sizes[(batch_sizes >= 80) & (batch_sizes < 100)])),
        "100+": int(len(batch_sizes[batch_sizes >= 100]))
    }

    stats["ranges"] = ranges

    return stats


if __name__ == '__main__':
    import json
    import os
    import sys
    from . import load_nash_data, PROJECT_ROOT

    # Check for CLI arguments
    if len(sys.argv) >= 4:
        # CLI mode: python batch_analysis.py <nash_csv> <registry_json> <rate_cards_json>
        nash_path = sys.argv[1]
        registry_path = sys.argv[2]
        rates_path = sys.argv[3]

        nash_df = load_nash_data(nash_path)

        with open(registry_path, 'r') as f:
            store_registry = json.load(f)

        with open(rates_path, 'r') as f:
            rate_cards = json.load(f)

        # Return trip-level data for scatter plot
        trip_data = get_trip_level_batch_data(nash_df, rate_cards)
        print(json.dumps(trip_data))
    else:
        # Development mode: use example data
        nash_path = os.path.join(PROJECT_ROOT, 'Data Example', 'data_table_1 (2).csv')
        registry_path = os.path.join(PROJECT_ROOT, 'data', 'ca_store_registry.json')
        rates_path = os.path.join(PROJECT_ROOT, 'data', 'ca_rate_cards.json')

        nash_df = load_nash_data(nash_path)

        with open(registry_path, 'r') as f:
            store_registry = json.load(f)

        with open(rates_path, 'r') as f:
            rate_cards = json.load(f)

        # Show trip-level data for scatter plot
        print("Trip-level Batch Data (for scatter plot):")
        trip_data = get_trip_level_batch_data(nash_df, rate_cards)
        print(json.dumps(trip_data, indent=2))

        print("\nBatch Density Analysis:")
        batch_analysis = analyze_batch_density(nash_df, store_registry)
        print(json.dumps(batch_analysis, indent=2))

        print("\nBatch Size Distribution:")
        distribution = batch_size_distribution(nash_df)
        print(json.dumps(distribution, indent=2))

        print("\nUnderperforming Stores:")
        underperforming = identify_underperforming_stores(nash_df, store_registry)
        print(json.dumps(underperforming, indent=2))
