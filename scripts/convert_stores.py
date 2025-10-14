#!/usr/bin/env python3
"""
Store Data Converter
Converts Walmart stores Excel file to CSV format and filters CA stores.
"""

import pandas as pd
import sys
from pathlib import Path

def convert_stores(excel_path, output_all, output_ca):
    """
    Convert Excel store data to CSV and create CA-only version.

    Args:
        excel_path: Path to the Excel file (Book3.xlsx)
        output_all: Output path for all stores CSV
        output_ca: Output path for CA stores only CSV
    """
    print(f"Reading Excel file: {excel_path}")

    # Read the Excel file
    df = pd.read_excel(excel_path)

    print(f"Total stores found: {len(df)}")

    # Save all stores
    df.to_csv(output_all, index=False)
    print(f"Saved all stores to: {output_all}")

    # Filter CA stores
    ca_stores = df[df['State'] == 'CA']
    print(f"CA stores found: {len(ca_stores)}")

    # Save CA stores
    ca_stores.to_csv(output_ca, index=False)
    print(f"Saved CA stores to: {output_ca}")

    return len(df), len(ca_stores)

if __name__ == '__main__':
    # Define paths
    base_dir = Path(__file__).parent.parent
    excel_path = base_dir / 'States' / 'Book3.xlsx'
    output_all = base_dir / 'States' / 'walmart_stores_all.csv'
    output_ca = base_dir / 'States' / 'walmart_stores_ca_only.csv'

    try:
        total, ca_count = convert_stores(excel_path, output_all, output_ca)
        print(f"\nConversion complete!")
        print(f"Total stores: {total}")
        print(f"CA stores: {ca_count}")

        if ca_count != 273:
            print(f"WARNING: Expected 273 CA stores, but found {ca_count}")
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
