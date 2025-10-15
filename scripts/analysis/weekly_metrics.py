#!/usr/bin/env python3
"""
Weekly Metrics Analysis Module
Analyze CA store performance metrics week-over-week.
"""

import pandas as pd
from typing import Dict, Any, List
from datetime import datetime, timedelta
from . import (
    filter_ca_stores,
    normalize_carrier_name,
    safe_mean,
    safe_sum
)
from .cpd_analysis import calculate_van_cpd


def get_week_start(date: pd.Timestamp) -> pd.Timestamp:
    """
    Get the Monday of the week for a given date.

    Args:
        date: Any date in the week

    Returns:
        pd.Timestamp: Monday of that week
    """
    return date - timedelta(days=date.weekday())


def analyze_weekly_metrics(
    nash_df: pd.DataFrame,
    rate_cards: Dict[str, Any],
    min_batch_size: int = 10
) -> Dict[str, Any]:
    """
    Analyze metrics week-over-week for all CA stores.

    Metrics included:
    - Total orders, trips, batches per week
    - Average CPD per week (with anomaly exclusion)
    - Carrier performance per week
    - Store performance per week
    - Exclusions per week

    Args:
        nash_df: DataFrame with Nash trip data
        rate_cards: Rate cards for CPD calculation
        min_batch_size: Minimum batch size to include (default 10)

    Returns:
        dict: Weekly metrics with all dimensions
    """
    # Filter to CA stores
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty or 'Date' not in ca_df.columns:
        return {
            "weeks": [],
            "summary": {
                "total_weeks": 0,
                "date_range": {"start": None, "end": None}
            }
        }

    # Normalize carrier names
    ca_df['Carrier_Normalized'] = ca_df['Carrier'].apply(normalize_carrier_name)

    # Add week column (Monday of each week)
    ca_df['Week_Start'] = ca_df['Date'].apply(get_week_start)

    weekly_data = []
    excluded_by_week = {}

    # Group by week
    for week_start, week_df in ca_df.groupby('Week_Start'):
        week_end = week_start + timedelta(days=6)

        # Overall metrics for the week
        total_trips = len(week_df)
        total_orders = 0
        total_cost = 0.0
        excluded_count = 0

        # Store metrics
        store_metrics = {}

        # Carrier metrics
        carrier_metrics = {}

        for _, row in week_df.iterrows():
            batch_size = row['Total Orders']
            carrier = row['Carrier_Normalized']
            store_id = str(row['Store Id'])

            if pd.isna(batch_size) or batch_size == 0:
                continue

            batch_size_int = int(batch_size)

            # Anomaly exclusion
            if batch_size_int < min_batch_size:
                excluded_count += 1
                continue

            # Get rate card
            vendor_rates = rate_cards.get('vendors', {}).get(carrier)
            if not vendor_rates:
                continue

            # Calculate trip cost
            if batch_size_int <= 80:
                base_rate = vendor_rates.get('base_rate_80', 0)
            else:
                base_rate = vendor_rates.get('base_rate_100', 0)

            adjustment = vendor_rates.get('contractual_adjustment', 1.0)
            trip_cost = base_rate * adjustment

            total_cost += trip_cost
            total_orders += batch_size_int

            # Track by store
            if store_id not in store_metrics:
                store_metrics[store_id] = {
                    "orders": 0,
                    "trips": 0,
                    "cost": 0.0
                }
            store_metrics[store_id]["orders"] += batch_size_int
            store_metrics[store_id]["trips"] += 1
            store_metrics[store_id]["cost"] += trip_cost

            # Track by carrier
            if carrier not in carrier_metrics:
                carrier_metrics[carrier] = {
                    "orders": 0,
                    "trips": 0,
                    "cost": 0.0
                }
            carrier_metrics[carrier]["orders"] += batch_size_int
            carrier_metrics[carrier]["trips"] += 1
            carrier_metrics[carrier]["cost"] += trip_cost

        # Calculate weighted average CPD for the week
        avg_cpd = (total_cost / total_orders) if total_orders > 0 else 0.0

        # Format store metrics
        stores_list = []
        for store_id, metrics in store_metrics.items():
            store_cpd = (metrics["cost"] / metrics["orders"]) if metrics["orders"] > 0 else 0.0
            stores_list.append({
                "store_id": store_id,
                "orders": metrics["orders"],
                "trips": metrics["trips"],
                "cpd": round(store_cpd, 2)
            })

        # Format carrier metrics
        carriers_list = []
        for carrier, metrics in carrier_metrics.items():
            carrier_cpd = (metrics["cost"] / metrics["orders"]) if metrics["orders"] > 0 else 0.0
            carriers_list.append({
                "carrier": carrier,
                "orders": metrics["orders"],
                "trips": metrics["trips"],
                "cpd": round(carrier_cpd, 2)
            })

        weekly_data.append({
            "week_start": week_start.strftime('%Y-%m-%d'),
            "week_end": week_end.strftime('%Y-%m-%d'),
            "total_orders": total_orders,
            "total_trips": total_trips - excluded_count,
            "total_batches": total_trips - excluded_count,
            "avg_cpd": round(avg_cpd, 2),
            "excluded_trips": excluded_count,
            "active_stores": len(store_metrics),
            "stores": stores_list,
            "carriers": carriers_list
        })

    # Sort by week
    weekly_data.sort(key=lambda x: x['week_start'])

    # Calculate summary
    all_dates = ca_df['Date'].dropna()
    date_range = {
        "start": all_dates.min().strftime('%Y-%m-%d') if not all_dates.empty else None,
        "end": all_dates.max().strftime('%Y-%m-%d') if not all_dates.empty else None
    }

    return {
        "weeks": weekly_data,
        "summary": {
            "total_weeks": len(weekly_data),
            "date_range": date_range,
            "min_batch_size": min_batch_size
        }
    }


if __name__ == '__main__':
    import json
    import os
    import sys
    from . import load_nash_data, PROJECT_ROOT

    # Check for CLI arguments
    if len(sys.argv) >= 3:
        # CLI mode: python weekly_metrics.py <nash_csv> <rate_cards_json>
        nash_path = sys.argv[1]
        rates_path = sys.argv[2]

        nash_df = load_nash_data(nash_path)

        with open(rates_path, 'r') as f:
            rate_cards = json.load(f)

        weekly_metrics = analyze_weekly_metrics(nash_df, rate_cards)
        print(json.dumps(weekly_metrics))
    else:
        # Development mode: use example data
        nash_path = os.path.join(PROJECT_ROOT, 'Data Example', 'data_table_1 (2).csv')
        rates_path = os.path.join(PROJECT_ROOT, 'data', 'ca_rate_cards.json')

        nash_df = load_nash_data(nash_path)

        with open(rates_path, 'r') as f:
            rate_cards = json.load(f)

        # Analyze weekly metrics
        print("Weekly Metrics Analysis:")
        weekly_metrics = analyze_weekly_metrics(nash_df, rate_cards)
        print(json.dumps(weekly_metrics, indent=2))
