#!/usr/bin/env python3
"""
Performance Metrics Module
Calculate detailed performance metrics.
"""

import pandas as pd
from typing import Dict, Any
from . import (
    filter_ca_stores,
    calculate_otd_percentage,
    safe_mean,
    safe_sum
)


def calculate_performance_metrics(nash_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calculate detailed performance metrics.

    Args:
        nash_df: DataFrame with Nash trip data

    Returns:
        dict: Performance metrics including timing, efficiency, and delivery stats
    """
    # Filter to CA stores
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {
            "timing": {
                "avg_driver_dwell_time": 0.0,
                "avg_load_time": 0.0,
                "avg_driver_sort_time": 0.0,
                "avg_trip_actual_time": 0.0
            },
            "efficiency": {
                "drops_per_hour_trip": 0.0,
                "drops_per_hour_total": 0.0,
                "failed_orders_rate": 0.0,
                "returned_orders_rate": 0.0
            },
            "delivery": {
                "otd_percentage": 0.0,
                "delivered_orders": 0,
                "failed_orders": 0,
                "returned_orders": 0,
                "pending_orders": 0
            }
        }

    # Calculate timing metrics
    timing = {
        "avg_driver_dwell_time": round(safe_mean(ca_df['Driver Dwell Time']), 2),
        "avg_load_time": round(safe_mean(ca_df['Driver Load Time']), 2),
        "avg_driver_sort_time": round(safe_mean(ca_df['Driver Sort Time']), 2),
        "avg_trip_actual_time": round(safe_mean(ca_df['Trip Actual Time']), 2)
    }

    # Calculate efficiency metrics
    total_orders = safe_sum(ca_df['Total Orders'])

    efficiency = {
        "drops_per_hour_trip": round(safe_mean(ca_df['Drops Per Hour Trip']), 2),
        "drops_per_hour_total": round(safe_mean(ca_df['Drops Per Hour Total']), 2),
        "failed_orders_rate": round(
            (safe_sum(ca_df['Failed Orders']) / total_orders * 100) if total_orders > 0 else 0.0,
            2
        ),
        "returned_orders_rate": round(
            (safe_sum(ca_df['Returned Orders']) / total_orders * 100) if total_orders > 0 else 0.0,
            2
        )
    }

    # Calculate delivery metrics
    delivery = {
        "otd_percentage": round(calculate_otd_percentage(ca_df), 2),
        "delivered_orders": int(safe_sum(ca_df['Delivered Orders'])),
        "failed_orders": int(safe_sum(ca_df['Failed Orders'])),
        "returned_orders": int(safe_sum(ca_df['Returned Orders'])),
        "pending_orders": int(safe_sum(ca_df['Pending Orders']))
    }

    return {
        "timing": timing,
        "efficiency": efficiency,
        "delivery": delivery
    }


def analyze_timing_by_store(nash_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyze timing metrics for each store.

    Args:
        nash_df: DataFrame with Nash trip data

    Returns:
        dict: Timing metrics by store
    """
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {}

    store_timing = {}

    for store_id in ca_df['Store Id'].unique():
        store_df = ca_df[ca_df['Store Id'] == str(store_id)]

        store_timing[str(store_id)] = {
            "avg_dwell_time": round(safe_mean(store_df['Driver Dwell Time']), 2),
            "avg_load_time": round(safe_mean(store_df['Driver Load Time']), 2),
            "avg_sort_time": round(safe_mean(store_df['Driver Sort Time']), 2),
            "avg_trip_time": round(safe_mean(store_df['Trip Actual Time']), 2),
            "total_trips": len(store_df)
        }

    return store_timing


def calculate_delivery_success_rates(nash_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calculate delivery success rates and order status breakdown.

    Args:
        nash_df: DataFrame with Nash trip data

    Returns:
        dict: Delivery success metrics
    """
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {
            "overall": {},
            "by_carrier": {}
        }

    # Overall success rates
    total_orders = safe_sum(ca_df['Total Orders'])
    delivered = safe_sum(ca_df['Delivered Orders'])
    failed = safe_sum(ca_df['Failed Orders'])
    returned = safe_sum(ca_df['Returned Orders'])
    pending = safe_sum(ca_df['Pending Orders'])

    overall = {
        "total_orders": int(total_orders),
        "delivered": int(delivered),
        "failed": int(failed),
        "returned": int(returned),
        "pending": int(pending),
        "success_rate": round((delivered / total_orders * 100) if total_orders > 0 else 0.0, 2),
        "failure_rate": round((failed / total_orders * 100) if total_orders > 0 else 0.0, 2),
        "return_rate": round((returned / total_orders * 100) if total_orders > 0 else 0.0, 2)
    }

    # By carrier
    from . import normalize_carrier_name
    ca_df['Carrier_Normalized'] = ca_df['Carrier'].apply(normalize_carrier_name)

    by_carrier = {}
    for carrier in ca_df['Carrier_Normalized'].unique():
        carrier_df = ca_df[ca_df['Carrier_Normalized'] == carrier]

        carrier_total = safe_sum(carrier_df['Total Orders'])
        carrier_delivered = safe_sum(carrier_df['Delivered Orders'])
        carrier_failed = safe_sum(carrier_df['Failed Orders'])

        by_carrier[carrier] = {
            "total_orders": int(carrier_total),
            "delivered": int(carrier_delivered),
            "failed": int(carrier_failed),
            "success_rate": round(
                (carrier_delivered / carrier_total * 100) if carrier_total > 0 else 0.0,
                2
            )
        }

    return {
        "overall": overall,
        "by_carrier": by_carrier
    }


if __name__ == '__main__':
    import json
    import os
    import sys
    from . import load_nash_data, PROJECT_ROOT

    # Check for CLI arguments
    if len(sys.argv) >= 2:
        # CLI mode: python performance.py <nash_csv>
        nash_path = sys.argv[1]

        nash_df = load_nash_data(nash_path)

        performance = calculate_performance_metrics(nash_df)
        print(json.dumps(performance))
    else:
        # Development mode: use example data
        nash_path = os.path.join(PROJECT_ROOT, 'Data Example', 'data_table_1 (2).csv')
        nash_df = load_nash_data(nash_path)

        # Calculate performance metrics
        print("Performance Metrics:")
        performance = calculate_performance_metrics(nash_df)
        print(json.dumps(performance, indent=2))

        print("\nDelivery Success Rates:")
        success_rates = calculate_delivery_success_rates(nash_df)
        print(json.dumps(success_rates, indent=2))

        print("\nTiming by Store (sample):")
        timing_by_store = analyze_timing_by_store(nash_df)
        # Print first 3 stores only
        sample_stores = dict(list(timing_by_store.items())[:3])
        print(json.dumps(sample_stores, indent=2))
