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
    rate_cards: Dict[str, Any],
    min_batch_size: int = 10
) -> Dict[str, Any]:
    """
    Compare Van CPD vs Spark CPD for all stores with anomaly exclusion.

    Args:
        nash_df: DataFrame with Nash trip data
        store_registry: Store registry with Spark CPD data
        rate_cards: Rate cards for vendors
        min_batch_size: Minimum batch size to include (default 10, excludes anomalies)

    Returns:
        dict: Comparison data with store-level and overall metrics
              stores is an ARRAY of objects (not a dict)
              Includes exclusion metrics for transparency
    """
    # Filter to CA stores
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {
            "stores": [],
            "overall": {
                "avg_van_cpd": 0.0,
                "avg_spark_cpd": 0.0,
                "avg_savings": 0.0
            },
            "exclusions": {
                "total_excluded": 0,
                "excluded_trips": []
            }
        }

    # Normalize carrier names
    ca_df['Carrier_Normalized'] = ca_df['Carrier'].apply(normalize_carrier_name)

    # Track exclusions
    excluded_trips = []
    total_excluded = 0

    # Calculate CPD for each store
    store_cpd_list = []
    all_van_cpd_weighted = []
    all_spark_cpd = []
    all_orders = []

    for store_id in ca_df['Store Id'].unique():
        store_df = ca_df[ca_df['Store Id'] == store_id]

        # Calculate Van CPD for this store using WEIGHTED AVERAGE
        total_cost = 0.0
        total_orders = 0
        included_trips = 0
        excluded_for_store = 0

        for _, row in store_df.iterrows():
            carrier = row['Carrier_Normalized']
            batch_size = row['Total Orders']

            if pd.isna(batch_size) or batch_size == 0:
                continue

            # ANOMALY EXCLUSION: Skip batches smaller than threshold
            if batch_size < min_batch_size:
                excluded_trips.append({
                    "store_id": str(store_id),
                    "date": str(row.get('Date', 'N/A')),
                    "carrier": carrier,
                    "batch_size": int(batch_size),
                    "reason": f"Batch size < {min_batch_size} orders"
                })
                total_excluded += 1
                excluded_for_store += 1
                continue

            vendor_rates = rate_cards.get('vendors', {}).get(carrier)
            if not vendor_rates:
                continue

            # Calculate trip cost (not CPD yet)
            batch_size_int = int(batch_size)
            if batch_size_int <= 80:
                base_rate = vendor_rates.get('base_rate_80', 0)
            else:
                base_rate = vendor_rates.get('base_rate_100', 0)

            adjustment = vendor_rates.get('contractual_adjustment', 1.0)
            trip_cost = base_rate * adjustment

            total_cost += trip_cost
            total_orders += batch_size_int
            included_trips += 1

        if total_orders == 0:
            continue

        # WEIGHTED AVERAGE CPD = total cost / total orders
        avg_van_cpd = total_cost / total_orders

        # Get Spark CPD from store registry
        store_data = store_registry.get('stores', {}).get(str(store_id), {})
        spark_cpd = store_data.get('spark_cpd', 5.70)  # Default if not found

        # Calculate savings
        savings = spark_cpd - avg_van_cpd
        savings_percentage = (savings / spark_cpd * 100) if spark_cpd > 0 else 0

        # Add to array (not dict)
        store_cpd_list.append({
            "store_id": str(store_id),
            "van_cpd": round(avg_van_cpd, 2),
            "spark_cpd": round(spark_cpd, 2),
            "savings": round(savings, 2),
            "savings_percentage": round(savings_percentage, 1),
            "van_orders": total_orders,
            "included_trips": included_trips,
            "excluded_trips": excluded_for_store
        })

        all_van_cpd_weighted.append(avg_van_cpd)
        all_spark_cpd.append(spark_cpd)
        all_orders.append(total_orders)

    # Calculate overall averages (weighted by order volume)
    if sum(all_orders) > 0:
        overall_van_cpd = sum(cpd * orders for cpd, orders in zip(all_van_cpd_weighted, all_orders)) / sum(all_orders)
    else:
        overall_van_cpd = 0.0

    overall = {
        "avg_van_cpd": round(overall_van_cpd, 2),
        "avg_spark_cpd": round(sum(all_spark_cpd) / len(all_spark_cpd), 2) if all_spark_cpd else 0.0,
    }
    overall["avg_savings"] = round(overall["avg_spark_cpd"] - overall["avg_van_cpd"], 2)

    return {
        "stores": store_cpd_list,
        "overall": overall,
        "exclusions": {
            "total_excluded": total_excluded,
            "min_batch_size": min_batch_size,
            "excluded_trips": excluded_trips
        }
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
