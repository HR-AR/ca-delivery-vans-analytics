#!/usr/bin/env python3
"""
CPD (Cost Per Delivery) Analysis Module
Calculate and compare Van CPD vs Spark CPD.
"""

import pandas as pd
from typing import Dict, Any
from . import (
    filter_ca_stores,
    normalize_carrier_name
)


def calculate_van_cpd(
    trip_data: Dict[str, Any],
    rate_card: Dict[str, Any],
    batch_size: int
) -> float:
    """
    Calculate Van CPD for a trip.

    Formula:
    - If batch_size <= 80: use base_rate_80
    - If batch_size > 80: use base_rate_100
    - Apply contractual_adjustment multiplier
    - CPD = (rate * adjustment) / batch_size

    Args:
        trip_data: Dictionary with trip information
        rate_card: Rate card for the vendor
        batch_size: Number of orders in the batch

    Returns:
        float: Cost per delivery
    """
    if batch_size == 0:
        return 0.0

    # Determine which base rate to use
    if batch_size <= 80:
        base_rate = rate_card.get('base_rate_80', 0)
    else:
        base_rate = rate_card.get('base_rate_100', 0)

    # Apply contractual adjustment
    adjustment = rate_card.get('contractual_adjustment', 1.0)
    trip_cost = base_rate * adjustment

    # Calculate CPD
    cpd = trip_cost / batch_size
    return cpd


def compare_cpd(
    nash_df: pd.DataFrame,
    store_registry: Dict[str, Any],
    rate_cards: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compare Van CPD vs Spark CPD for all stores.

    Args:
        nash_df: DataFrame with Nash trip data
        store_registry: Store registry with Spark CPD data
        rate_cards: Rate cards for vendors

    Returns:
        dict: Comparison data with store-level and overall metrics
    """
    # Filter to CA stores
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {
            "stores": {},
            "overall": {
                "avg_van_cpd": 0.0,
                "avg_spark_cpd": 0.0,
                "avg_savings": 0.0
            }
        }

    # Normalize carrier names
    ca_df['Carrier_Normalized'] = ca_df['Carrier'].apply(normalize_carrier_name)

    # Calculate CPD for each store
    store_cpd = {}
    all_van_cpd = []
    all_spark_cpd = []

    for store_id in ca_df['Store Id'].unique():
        store_df = ca_df[ca_df['Store Id'] == store_id]

        # Calculate Van CPD for this store
        van_cpd_values = []
        for _, row in store_df.iterrows():
            carrier = row['Carrier_Normalized']
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
            van_cpd_values.append(trip_cpd)

        if not van_cpd_values:
            continue

        avg_van_cpd = sum(van_cpd_values) / len(van_cpd_values)

        # Get Spark CPD from store registry
        store_data = store_registry.get('stores', {}).get(str(store_id), {})
        spark_cpd = store_data.get('spark_cpd', 5.70)  # Default if not found

        # Calculate savings
        savings = spark_cpd - avg_van_cpd
        savings_percentage = (savings / spark_cpd * 100) if spark_cpd > 0 else 0

        store_cpd[str(store_id)] = {
            "van_cpd": round(avg_van_cpd, 2),
            "spark_cpd": round(spark_cpd, 2),
            "savings": round(savings, 2),
            "savings_percentage": round(savings_percentage, 1)
        }

        all_van_cpd.append(avg_van_cpd)
        all_spark_cpd.append(spark_cpd)

    # Calculate overall averages
    overall = {
        "avg_van_cpd": round(sum(all_van_cpd) / len(all_van_cpd), 2) if all_van_cpd else 0.0,
        "avg_spark_cpd": round(sum(all_spark_cpd) / len(all_spark_cpd), 2) if all_spark_cpd else 0.0,
    }
    overall["avg_savings"] = round(overall["avg_spark_cpd"] - overall["avg_van_cpd"], 2)

    return {
        "stores": store_cpd,
        "overall": overall
    }


def calculate_cpd_by_carrier(
    nash_df: pd.DataFrame,
    rate_cards: Dict[str, Any]
) -> Dict[str, float]:
    """
    Calculate average CPD for each carrier.

    Args:
        nash_df: DataFrame with Nash trip data
        rate_cards: Rate cards for vendors

    Returns:
        dict: Average CPD by carrier
    """
    ca_df = filter_ca_stores(nash_df.copy())
    ca_df['Carrier_Normalized'] = ca_df['Carrier'].apply(normalize_carrier_name)

    carrier_cpd = {}

    for carrier in ca_df['Carrier_Normalized'].unique():
        carrier_df = ca_df[ca_df['Carrier_Normalized'] == carrier]

        cpd_values = []
        for _, row in carrier_df.iterrows():
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

        if cpd_values:
            carrier_cpd[carrier] = round(sum(cpd_values) / len(cpd_values), 2)

    return carrier_cpd


if __name__ == '__main__':
    import json
    import os
    import sys
    from . import load_nash_data, PROJECT_ROOT

    # Check for CLI arguments
    if len(sys.argv) >= 4:
        # CLI mode: python cpd_analysis.py <nash_csv> <registry_json> <rate_cards_json>
        nash_path = sys.argv[1]
        registry_path = sys.argv[2]
        rates_path = sys.argv[3]

        nash_df = load_nash_data(nash_path)

        with open(registry_path, 'r') as f:
            store_registry = json.load(f)

        with open(rates_path, 'r') as f:
            rate_cards = json.load(f)

        cpd_comparison = compare_cpd(nash_df, store_registry, rate_cards)
        print(json.dumps(cpd_comparison))
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

        # Calculate CPD comparison
        cpd_comparison = compare_cpd(nash_df, store_registry, rate_cards)

        # Print results
        print("CPD Comparison:")
        print(json.dumps(cpd_comparison, indent=2))

        # Calculate CPD by carrier
        print("\nCPD by Carrier:")
        carrier_cpd = calculate_cpd_by_carrier(nash_df, rate_cards)
        print(json.dumps(carrier_cpd, indent=2))
