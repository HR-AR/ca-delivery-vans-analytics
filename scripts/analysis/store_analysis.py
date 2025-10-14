#!/usr/bin/env python3
"""
Store-Level Analysis Module
Analyze metrics for each individual store.
"""

import pandas as pd
from typing import Dict, Any
from . import (
    filter_ca_stores,
    calculate_otd_percentage,
    safe_mean,
    safe_sum,
    normalize_carrier_name,
    get_date_range
)
from .cpd_analysis import calculate_van_cpd


def analyze_store(
    store_id: str,
    nash_df: pd.DataFrame,
    store_registry: Dict[str, Any],
    rate_cards: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate metrics for a specific store.

    Args:
        store_id: Store ID to analyze
        nash_df: DataFrame with Nash trip data
        store_registry: Store registry with Spark CPD data
        rate_cards: Rate cards for vendors

    Returns:
        dict: Store-specific metrics
    """
    # Filter to CA stores and specific store
    ca_df = filter_ca_stores(nash_df.copy())
    store_df = ca_df[ca_df['Store Id'] == str(store_id)]

    if store_df.empty:
        return {
            "store_id": str(store_id),
            "total_orders": 0,
            "total_trips": 0,
            "van_cpd": 0.0,
            "spark_cpd": 0.0,
            "cpd_difference": 0.0,
            "otd_percentage": 0.0,
            "avg_batch_size": 0.0,
            "target_batch_size": 0,
            "carriers": [],
            "date_range": {"start": None, "end": None}
        }

    # Calculate totals
    total_orders = int(safe_sum(store_df['Total Orders']))
    total_trips = len(store_df)

    # Calculate OTD percentage
    otd_percentage = calculate_otd_percentage(store_df)

    # Calculate average batch size
    avg_batch_size = safe_mean(store_df['Total Orders'])

    # Get carriers for this store
    store_df['Carrier_Normalized'] = store_df['Carrier'].apply(normalize_carrier_name)
    carriers = sorted(store_df['Carrier_Normalized'].unique().tolist())

    # Calculate Van CPD for this store
    van_cpd = _calculate_store_van_cpd(store_df, rate_cards)

    # Get Spark CPD from store registry
    store_data = store_registry.get('stores', {}).get(str(store_id), {})
    spark_cpd = store_data.get('spark_cpd', 5.70)  # Default if not found
    target_batch_size = store_data.get('target_batch_size', 90)  # Default target

    # Calculate CPD difference (positive = savings)
    cpd_difference = spark_cpd - van_cpd

    # Get date range
    date_range = get_date_range(store_df)

    return {
        "store_id": str(store_id),
        "total_orders": total_orders,
        "total_trips": total_trips,
        "van_cpd": round(van_cpd, 2),
        "spark_cpd": round(spark_cpd, 2),
        "cpd_difference": round(cpd_difference, 2),
        "otd_percentage": round(otd_percentage, 2),
        "avg_batch_size": round(avg_batch_size, 1),
        "target_batch_size": target_batch_size,
        "carriers": carriers,
        "date_range": date_range
    }


def analyze_all_stores(
    nash_df: pd.DataFrame,
    store_registry: Dict[str, Any],
    rate_cards: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Analyze all stores in the Nash data.

    Args:
        nash_df: DataFrame with Nash trip data
        store_registry: Store registry with Spark CPD data
        rate_cards: Rate cards for vendors

    Returns:
        dict: Metrics for all stores
    """
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {}

    store_metrics = {}
    for store_id in ca_df['Store Id'].unique():
        store_metrics[str(store_id)] = analyze_store(
            store_id, nash_df, store_registry, rate_cards
        )

    return store_metrics


def _calculate_store_van_cpd(df: pd.DataFrame, rate_cards: Dict[str, Any]) -> float:
    """
    Calculate average Van CPD for a store.

    Args:
        df: Filtered DataFrame for the store
        rate_cards: Rate card data

    Returns:
        float: Average Van CPD
    """
    cpd_values = []

    for _, row in df.iterrows():
        carrier = normalize_carrier_name(row['Carrier'])
        total_orders = row['Total Orders']

        if pd.isna(total_orders) or total_orders == 0:
            continue

        vendor_rates = rate_cards.get('vendors', {}).get(carrier)
        if not vendor_rates:
            continue

        trip_cpd = calculate_van_cpd(
            trip_data=row.to_dict(),
            rate_card=vendor_rates,
            batch_size=int(total_orders)
        )
        cpd_values.append(trip_cpd)

    if not cpd_values:
        return 0.0

    return sum(cpd_values) / len(cpd_values)


if __name__ == '__main__':
    import json
    import os
    import sys
    from . import load_nash_data, PROJECT_ROOT

    # Check for CLI arguments
    if len(sys.argv) >= 5:
        # CLI mode: python store_analysis.py <nash_csv> <store_id> <registry_json> <rate_cards_json>
        nash_path = sys.argv[1]
        store_id = sys.argv[2]
        registry_path = sys.argv[3]
        rates_path = sys.argv[4]

        nash_df = load_nash_data(nash_path)

        with open(registry_path, 'r') as f:
            store_registry = json.load(f)

        with open(rates_path, 'r') as f:
            rate_cards = json.load(f)

        metrics = analyze_store(store_id, nash_df, store_registry, rate_cards)
        print(json.dumps(metrics))
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

        # Analyze specific store (2082 if it exists in data)
        store_id = '2082'
        if store_id in nash_df['Store Id'].astype(str).values:
            print(f"Store {store_id} Analysis:")
            metrics = analyze_store(store_id, nash_df, store_registry, rate_cards)
            print(json.dumps(metrics, indent=2))
        else:
            # Analyze first store in data
            first_store = nash_df['Store Id'].iloc[0]
            print(f"Store {first_store} Analysis:")
            metrics = analyze_store(str(first_store), nash_df, store_registry, rate_cards)
            print(json.dumps(metrics, indent=2))
