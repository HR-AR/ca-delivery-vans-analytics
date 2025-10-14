#!/usr/bin/env python3
"""
Vendor Performance Comparison Module
Compare performance across FOX, NTG, FDC.
"""

import pandas as pd
from typing import Dict, Any
from . import (
    filter_ca_stores,
    calculate_otd_percentage,
    safe_mean,
    safe_sum,
    normalize_carrier_name
)
from .cpd_analysis import calculate_van_cpd


def analyze_vendors(
    nash_df: pd.DataFrame,
    rate_cards: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compare vendor performance metrics.

    Args:
        nash_df: DataFrame with Nash trip data
        rate_cards: Rate cards for vendors

    Returns:
        dict: Performance metrics by vendor (FOX, NTG, FDC)
    """
    # Filter to CA stores
    ca_df = filter_ca_stores(nash_df.copy())

    if ca_df.empty:
        return {}

    # Normalize carrier names
    ca_df['Carrier_Normalized'] = ca_df['Carrier'].apply(normalize_carrier_name)

    # Analyze each vendor
    vendor_metrics = {}

    for vendor in ca_df['Carrier_Normalized'].unique():
        vendor_df = ca_df[ca_df['Carrier_Normalized'] == vendor]

        metrics = _analyze_vendor(vendor_df, vendor, rate_cards)
        vendor_metrics[vendor] = metrics

    return vendor_metrics


def _analyze_vendor(
    vendor_df: pd.DataFrame,
    vendor_name: str,
    rate_cards: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Analyze a single vendor's performance.

    Args:
        vendor_df: DataFrame filtered to vendor
        vendor_name: Name of the vendor
        rate_cards: Rate card data

    Returns:
        dict: Vendor performance metrics
    """
    # Total trips and orders
    total_trips = len(vendor_df)
    total_orders = int(safe_sum(vendor_df['Total Orders']))

    # Calculate average CPD
    avg_cpd = _calculate_vendor_avg_cpd(vendor_df, vendor_name, rate_cards)

    # Calculate OTD percentage
    otd_percentage = calculate_otd_percentage(vendor_df)

    # Calculate average driver time (in minutes)
    avg_driver_time = safe_mean(vendor_df['Driver Total Time'])

    # Calculate drops per hour
    # Use 'Drops Per Hour Trip' if available
    if 'Drops Per Hour Trip' in vendor_df.columns:
        drops_per_hour = safe_mean(vendor_df['Drops Per Hour Trip'])
    else:
        # Calculate from data: orders / (trip_actual_time / 60)
        vendor_df_calc = vendor_df.copy()
        vendor_df_calc['calc_dph'] = vendor_df_calc.apply(
            lambda row: (row['Total Orders'] / (row['Trip Actual Time'] / 60))
            if pd.notna(row['Trip Actual Time']) and row['Trip Actual Time'] > 0
            else 0,
            axis=1
        )
        drops_per_hour = safe_mean(vendor_df_calc['calc_dph'])

    return {
        "total_trips": total_trips,
        "total_orders": total_orders,
        "avg_cpd": round(avg_cpd, 2),
        "otd_percentage": round(otd_percentage, 2),
        "avg_driver_time": round(avg_driver_time, 2),
        "drops_per_hour": round(drops_per_hour, 2)
    }


def _calculate_vendor_avg_cpd(
    vendor_df: pd.DataFrame,
    vendor_name: str,
    rate_cards: Dict[str, Any]
) -> float:
    """
    Calculate average CPD for a vendor.

    Args:
        vendor_df: DataFrame filtered to vendor
        vendor_name: Name of the vendor
        rate_cards: Rate card data

    Returns:
        float: Average CPD
    """
    vendor_rates = rate_cards.get('vendors', {}).get(vendor_name)
    if not vendor_rates:
        return 0.0

    cpd_values = []

    for _, row in vendor_df.iterrows():
        total_orders = row['Total Orders']

        if pd.isna(total_orders) or total_orders == 0:
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


def compare_vendor_efficiency(nash_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compare operational efficiency metrics across vendors.

    Args:
        nash_df: DataFrame with Nash trip data

    Returns:
        dict: Efficiency comparison metrics
    """
    ca_df = filter_ca_stores(nash_df.copy())
    ca_df['Carrier_Normalized'] = ca_df['Carrier'].apply(normalize_carrier_name)

    efficiency = {}

    for vendor in ca_df['Carrier_Normalized'].unique():
        vendor_df = ca_df[ca_df['Carrier_Normalized'] == vendor]

        efficiency[vendor] = {
            "avg_load_time": round(safe_mean(vendor_df['Driver Load Time']), 2),
            "avg_dwell_time": round(safe_mean(vendor_df['Driver Dwell Time']), 2),
            "avg_trip_time": round(safe_mean(vendor_df['Trip Actual Time']), 2),
            "delivery_success_rate": round(
                (safe_sum(vendor_df['Delivered Orders']) / safe_sum(vendor_df['Total Orders']) * 100)
                if safe_sum(vendor_df['Total Orders']) > 0 else 0.0,
                2
            )
        }

    return efficiency


if __name__ == '__main__':
    import json
    import os
    import sys
    from . import load_nash_data, PROJECT_ROOT

    # Check for CLI arguments
    if len(sys.argv) >= 3:
        # CLI mode: python vendor_analysis.py <nash_csv> <rate_cards_json>
        nash_path = sys.argv[1]
        rates_path = sys.argv[2]

        nash_df = load_nash_data(nash_path)

        with open(rates_path, 'r') as f:
            rate_cards = json.load(f)

        vendor_metrics = analyze_vendors(nash_df, rate_cards)
        print(json.dumps(vendor_metrics))
    else:
        # Development mode: use example data
        nash_path = os.path.join(PROJECT_ROOT, 'Data Example', 'data_table_1 (2).csv')
        rates_path = os.path.join(PROJECT_ROOT, 'data', 'ca_rate_cards.json')

        nash_df = load_nash_data(nash_path)

        with open(rates_path, 'r') as f:
            rate_cards = json.load(f)

        # Analyze vendors
        print("Vendor Performance Analysis:")
        vendor_metrics = analyze_vendors(nash_df, rate_cards)
        print(json.dumps(vendor_metrics, indent=2))

        print("\nVendor Efficiency Comparison:")
        efficiency = compare_vendor_efficiency(nash_df)
        print(json.dumps(efficiency, indent=2))
