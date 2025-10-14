"""
Common utilities for CA Delivery Vans Analytics - Phase 3
"""

import os
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from datetime import datetime

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_ca_stores() -> List[str]:
    """
    Load list of CA store IDs from the CA stores CSV file.

    Returns:
        List[str]: List of CA store IDs as strings
    """
    ca_stores_path = os.path.join(PROJECT_ROOT, 'States', 'walmart_stores_ca_only.csv')
    df = pd.read_csv(ca_stores_path)
    # Convert to string and handle any data type issues
    return df['Store ID'].astype(str).tolist()


def filter_ca_stores(nash_df: pd.DataFrame) -> pd.DataFrame:
    """
    Filter Nash data to CA stores only.

    Args:
        nash_df: DataFrame with Nash trip data

    Returns:
        pd.DataFrame: Filtered dataframe containing only CA stores
    """
    # Handle empty dataframe
    if nash_df.empty or 'Store Id' not in nash_df.columns:
        return nash_df

    ca_stores = load_ca_stores()
    # Convert Store Id column to string for comparison
    nash_df['Store Id'] = nash_df['Store Id'].astype(str)
    return nash_df[nash_df['Store Id'].isin(ca_stores)]


def parse_date(date_str: str) -> datetime:
    """
    Parse Nash date format (MM/DD/YYYY).

    Args:
        date_str: Date string in Nash format

    Returns:
        datetime: Parsed datetime object
    """
    try:
        return pd.to_datetime(date_str)
    except Exception:
        return None


def calculate_otd_percentage(df: pd.DataFrame) -> float:
    """
    Calculate OTD (On-Time Delivery) percentage from Nash data.
    Uses 'Is Pickup Arrived Ontime' column (1 = on-time, 0 = late).

    Args:
        df: DataFrame with Nash trip data

    Returns:
        float: OTD percentage (0-100)
    """
    if df.empty or 'Is Pickup Arrived Ontime' not in df.columns:
        return 0.0

    # Handle NaN values
    valid_data = df['Is Pickup Arrived Ontime'].dropna()
    if len(valid_data) == 0:
        return 0.0

    return (valid_data.sum() / len(valid_data)) * 100


def safe_mean(series: pd.Series, default: float = 0.0) -> float:
    """
    Calculate mean safely, handling NaN and empty series.

    Args:
        series: Pandas Series
        default: Default value if series is empty or all NaN

    Returns:
        float: Mean value or default
    """
    if series.empty:
        return default
    clean_series = series.dropna()
    if clean_series.empty:
        return default
    return float(clean_series.mean())


def safe_sum(series: pd.Series, default: float = 0.0) -> float:
    """
    Calculate sum safely, handling NaN and empty series.

    Args:
        series: Pandas Series
        default: Default value if series is empty or all NaN

    Returns:
        float: Sum value or default
    """
    if series.empty:
        return default
    return float(series.sum())


def normalize_carrier_name(carrier: str) -> str:
    """
    Normalize carrier names to standard format.
    Maps various carrier name formats to FOX, NTG, or FDC.

    Args:
        carrier: Raw carrier name from Nash data

    Returns:
        str: Normalized carrier name (FOX, NTG, FDC, or original if no match)
    """
    carrier_upper = str(carrier).upper().strip()

    # Mapping patterns
    if 'FOX' in carrier_upper:
        return 'FOX'
    elif 'NTG' in carrier_upper:
        return 'NTG'
    elif 'FRONT' in carrier_upper or 'FDC' in carrier_upper:
        return 'FDC'

    return carrier  # Return original if no match


def get_date_range(df: pd.DataFrame) -> Dict[str, str]:
    """
    Get the date range from Nash data.

    Args:
        df: DataFrame with Nash trip data

    Returns:
        dict: Dictionary with 'start' and 'end' dates in YYYY-MM-DD format
    """
    if df.empty or 'Date' not in df.columns:
        return {"start": None, "end": None}

    dates = pd.to_datetime(df['Date'])
    valid_dates = dates.dropna()

    if valid_dates.empty:
        return {"start": None, "end": None}

    return {
        "start": valid_dates.min().strftime('%Y-%m-%d'),
        "end": valid_dates.max().strftime('%Y-%m-%d')
    }


def load_nash_data(file_path: str) -> pd.DataFrame:
    """
    Load Nash CSV data with comprehensive data cleaning and type conversion.

    Handles:
    - String field whitespace trimming
    - Numeric field type conversion with error handling
    - Mixed date format parsing
    - Boolean field conversion
    - Missing value handling

    Args:
        file_path: Path to Nash CSV file

    Returns:
        pd.DataFrame: Loaded and cleaned Nash data
    """
    df = pd.read_csv(file_path)

    # 1. TRIM WHITESPACE from all string columns
    string_columns = df.select_dtypes(include=['object']).columns
    for col in string_columns:
        df[col] = df[col].astype(str).str.strip()

    # 2. CONVERT STORE ID to string (critical for matching)
    if 'Store Id' in df.columns:
        df['Store Id'] = df['Store Id'].astype(str).str.strip()

    # 3. PARSE DATES with mixed format support
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], format='mixed', errors='coerce')

    # 4. CONVERT NUMERIC FIELDS with error handling
    numeric_fields = ['Total Orders', 'Total Trips', 'Trip Distance']
    for field in numeric_fields:
        if field in df.columns:
            # pd.to_numeric converts to float64, then to nullable Int64
            df[field] = pd.to_numeric(df[field], errors='coerce').astype('Int64')

    # 5. CONVERT BOOLEAN FIELDS (0/1 to Int8)
    boolean_fields = ['Is Pickup Arrived Ontime', 'Has OnTime']
    for field in boolean_fields:
        if field in df.columns:
            df[field] = pd.to_numeric(df[field], errors='coerce').astype('Int8')

    # 6. TRIM CARRIER NAMES (critical for mapping)
    if 'Carrier' in df.columns:
        df['Carrier'] = df['Carrier'].str.strip()

    return df


__all__ = [
    'load_ca_stores',
    'filter_ca_stores',
    'parse_date',
    'calculate_otd_percentage',
    'safe_mean',
    'safe_sum',
    'normalize_carrier_name',
    'get_date_range',
    'load_nash_data',
    'PROJECT_ROOT'
]
