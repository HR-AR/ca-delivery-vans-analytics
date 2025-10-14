#!/usr/bin/env python3
"""
Dashboard Metrics Calculator
Calculate overall metrics for dashboard display.
"""

import pandas as pd
from typing import Dict, Any, List
from . import (
    filter_ca_stores,
    calculate_otd_percentage,
    safe_mean,
    safe_sum,
    normalize_carrier_name
)


def calculate_dashboard_metrics(
    nash_df: pd.DataFrame,
    store_registry: Dict[str, Any],
    rate_cards: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate high-level dashboard metrics.

    Args:
        nash_df: DataFrame with Nash trip data
        store_registry: Dict with store Spark CPD data
        rate_cards: Dict with vendor rates

    Returns:
        dict: Dashboard metrics including:
            - total_orders: Total orders across all trips
            - total_trips: Total number of trips
            - avg_van_cpd: Average Van CPD (calculated from Nash data + rate cards)
            - avg_spark_cpd: Average Spark CPD (from store registry)
            - target_cpd: Target CPD (5.00)
            - otd_percentage: Overall OTD %
            - active_stores: Count of active stores
            - carriers: List of carriers in data
    """
    # Filter to CA stores only
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {
            "total_orders": 0,
            "total_trips": 0,
            "avg_van_cpd": 0.0,
            "avg_spark_cpd": 0.0,
            "target_cpd": 5.00,
            "otd_percentage": 0.0,
            "active_stores": 0,
            "carriers": []
        }

    # Calculate total orders and trips
    total_orders = int(safe_sum(ca_df['Total Orders']))
    total_trips = len(ca_df)

    # Calculate OTD percentage
    otd_percentage = calculate_otd_percentage(ca_df)

    # Count active stores
    active_stores = ca_df['Store Id'].nunique()

    # Get unique carriers (normalized)
    ca_df['Carrier_Normalized'] = ca_df['Carrier'].apply(normalize_carrier_name)
    carriers = sorted(ca_df['Carrier_Normalized'].unique().tolist())

    # Calculate average Van CPD
    avg_van_cpd = _calculate_avg_van_cpd(ca_df, rate_cards)

    # Calculate average Spark CPD from store registry
    avg_spark_cpd = _calculate_avg_spark_cpd(ca_df, store_registry)

    return {
        "total_orders": total_orders,
        "total_trips": total_trips,
        "avg_van_cpd": round(avg_van_cpd, 2),
        "avg_spark_cpd": round(avg_spark_cpd, 2),
        "target_cpd": 5.00,
        "otd_percentage": round(otd_percentage, 2),
        "active_stores": active_stores,
        "carriers": carriers
    }


def _calculate_avg_van_cpd(df: pd.DataFrame, rate_cards: Dict[str, Any]) -> float:
    """
    Calculate average Van CPD across all trips.

    Args:
        df: Filtered DataFrame with Nash data
        rate_cards: Rate card data

    Returns:
        float: Average Van CPD
    """
    cpd_values = []

    for _, row in df.iterrows():
        carrier = normalize_carrier_name(row['Carrier'])
        total_orders = row['Total Orders']

        # Skip if no orders
        if pd.isna(total_orders) or total_orders == 0:
            continue

        # Get rate card for carrier
        vendor_rates = rate_cards.get('vendors', {}).get(carrier)
        if not vendor_rates:
            continue

        # Determine which base rate to use based on batch size
        if total_orders <= 80:
            base_rate = vendor_rates.get('base_rate_80', 0)
        else:
            base_rate = vendor_rates.get('base_rate_100', 0)

        # Apply contractual adjustment
        adjustment = vendor_rates.get('contractual_adjustment', 1.0)
        trip_cost = base_rate * adjustment

        # Calculate CPD for this trip
        cpd = trip_cost / total_orders
        cpd_values.append(cpd)

    if not cpd_values:
        return 0.0

    return sum(cpd_values) / len(cpd_values)


def _calculate_avg_spark_cpd(df: pd.DataFrame, store_registry: Dict[str, Any]) -> float:
    """
    Calculate average Spark CPD from store registry.

    Args:
        df: Filtered DataFrame with Nash data
        store_registry: Store registry data

    Returns:
        float: Average Spark CPD
    """
    stores = store_registry.get('stores', {})

    if not stores:
        # No store data yet, return placeholder
        return 5.70

    # Get unique stores in the data
    unique_stores = df['Store Id'].unique()

    cpd_values = []
    for store_id in unique_stores:
        store_data = stores.get(str(store_id))
        if store_data and 'spark_cpd' in store_data:
            cpd_values.append(store_data['spark_cpd'])

    if not cpd_values:
        return 5.70  # Default placeholder

    return sum(cpd_values) / len(cpd_values)


if __name__ == '__main__':
    import json
    import os
    import sys
    from . import load_nash_data, PROJECT_ROOT

    # Check for CLI arguments
    if len(sys.argv) >= 4:
        # CLI mode: use provided paths
        nash_path = sys.argv[1]
        registry_path = sys.argv[2]
        rates_path = sys.argv[3]
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

    # Calculate metrics
    metrics = calculate_dashboard_metrics(nash_df, store_registry, rate_cards)

    # Print results
    if len(sys.argv) >= 4:
        # CLI mode: compact JSON
        print(json.dumps(metrics))
    else:
        # Development mode: pretty JSON
        print(json.dumps(metrics, indent=2))
