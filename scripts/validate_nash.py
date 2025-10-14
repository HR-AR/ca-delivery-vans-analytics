#!/usr/bin/env python3
"""
Nash Data Validator
Validates Nash CSV files for required columns, data types, and CA store compliance.
"""

import pandas as pd
import json
import sys
from pathlib import Path
from typing import Dict, List, Any

# Required columns from Nash format (EXACT match required)
REQUIRED_COLUMNS = [
    "Carrier",
    "Date",
    "Store Id",  # lowercase 'd' - CRITICAL
    "Walmart Trip Id",
    "Courier Name",
    "Pickup Enroute",
    "Pickup Arrived",
    "Load Start Time",
    "Load End Time",
    "Pickup Complete",
    "Last Dropoff Complete",
    "Trip Planned Start",
    "Driver Dwell Time",
    "Driver Load Time",
    "Driver Sort Time",
    "Driver Store Time",
    "Trip Actual Time",
    "Driver Total Time",
    "Estimated Duration",
    "Headroom",
    "Total Orders",
    "Failed Pickups",
    "Driver Accepted Orders",
    "Delivered Orders",
    "Returned Orders",
    "Returned Attempted Orders",
    "Returned Not Attempted Orders",
    "Pending Orders",
    "Drops Per Hour Trip",
    "Drops Per Hour Total",
    "Adjusted Cddr",
    "Returned Orders Rate",
    "Failed Orders",
    "Failed Orders Rate",
    "Pending Orders Rate",
    "Is Pickup Arrived Ontime"
]

# Expected carriers
EXPECTED_CARRIERS = ["FOX", "NTG", "FDC", "Fox-Drop", "FRONTDoor Collective",
                     "JW Logistics", "DeliverOL", "Roadie (WMT)"]

class NashValidator:
    """Validator for Nash CSV data files."""

    def __init__(self, ca_stores_path: str):
        """
        Initialize validator with CA stores list.

        Args:
            ca_stores_path: Path to the CA stores CSV file
        """
        self.ca_stores = pd.read_csv(ca_stores_path)
        self.ca_store_ids = set(self.ca_stores['Store ID'].astype(str))
        print(f"Loaded {len(self.ca_store_ids)} CA store IDs")

    def validate(self, csv_path: str) -> Dict[str, Any]:
        """
        Validate a Nash CSV file.

        Args:
            csv_path: Path to the Nash CSV file to validate

        Returns:
            Dictionary with validation results
        """
        result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "stats": {}
        }

        try:
            # Read the CSV file
            df = pd.read_csv(csv_path)
            result["stats"]["total_rows"] = len(df)

            # Check for required columns
            missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
            if missing_columns:
                result["valid"] = False
                result["errors"].append({
                    "type": "MISSING_COLUMNS",
                    "message": f"Required columns missing: {', '.join(missing_columns)}",
                    "found_columns": list(df.columns),
                    "missing_columns": missing_columns,
                    "suggestion": "Contact Nash - column names may have changed"
                })
                return result

            # Check for critical column name variations
            if "Store ID" in df.columns and "Store Id" not in df.columns:
                result["valid"] = False
                result["errors"].append({
                    "type": "COLUMN_NAME_MISMATCH",
                    "message": "Found 'Store ID' but expected 'Store Id' (lowercase 'd')",
                    "found": "Store ID",
                    "expected": "Store Id",
                    "suggestion": "Contact Nash - column name changed from 'Store Id' to 'Store ID'"
                })
                return result

            # Validate Store Id column
            if "Store Id" in df.columns:
                # Convert Store Id to string for comparison
                df["Store Id"] = df["Store Id"].astype(str)

                # Check for CA stores
                stores_in_data = set(df["Store Id"].unique())
                ca_stores_in_data = stores_in_data.intersection(self.ca_store_ids)
                non_ca_stores = stores_in_data - self.ca_store_ids

                result["stats"]["unique_stores"] = len(stores_in_data)
                result["stats"]["ca_stores_found"] = len(ca_stores_in_data)
                result["stats"]["non_ca_stores_found"] = len(non_ca_stores)

                # Filter to CA stores only
                ca_rows = df[df["Store Id"].isin(self.ca_store_ids)]
                non_ca_rows = df[~df["Store Id"].isin(self.ca_store_ids)]

                result["stats"]["valid_rows"] = len(ca_rows)

                if len(non_ca_rows) > 0:
                    result["warnings"].append({
                        "type": "NON_CA_STORES",
                        "count": len(non_ca_rows),
                        "message": f"{len(non_ca_rows)} rows excluded (non-CA stores)",
                        "stores": sorted(list(non_ca_stores))[:10]  # Show first 10
                    })

            # Validate Carrier column
            if "Carrier" in df.columns:
                carriers_found = df["Carrier"].unique().tolist()
                result["stats"]["carriers_found"] = carriers_found

                unknown_carriers = [c for c in carriers_found if c not in EXPECTED_CARRIERS]
                if unknown_carriers:
                    result["warnings"].append({
                        "type": "UNKNOWN_CARRIERS",
                        "carriers": unknown_carriers,
                        "message": f"Unknown carriers found: {', '.join(unknown_carriers)}",
                        "suggestion": "Verify these carrier names with Nash"
                    })

            # Validate Date column
            if "Date" in df.columns:
                try:
                    df["Date"] = pd.to_datetime(df["Date"])
                    date_range = f"{df['Date'].min()} to {df['Date'].max()}"
                    result["stats"]["date_range"] = date_range
                except Exception as e:
                    result["warnings"].append({
                        "type": "DATE_PARSING_WARNING",
                        "message": f"Some dates could not be parsed: {str(e)}"
                    })

            # Validate Total Orders column
            if "Total Orders" in df.columns:
                try:
                    total_orders = df["Total Orders"].sum()
                    result["stats"]["total_orders"] = int(total_orders)
                except Exception as e:
                    result["warnings"].append({
                        "type": "TOTAL_ORDERS_WARNING",
                        "message": f"Could not sum Total Orders: {str(e)}"
                    })

            # Check for missing critical data
            critical_columns = ["Store Id", "Date", "Carrier", "Total Orders"]
            for col in critical_columns:
                if col in df.columns:
                    null_count = df[col].isnull().sum()
                    if null_count > 0:
                        result["warnings"].append({
                            "type": "NULL_VALUES",
                            "column": col,
                            "count": int(null_count),
                            "message": f"{null_count} null values found in critical column '{col}'"
                        })

        except FileNotFoundError:
            result["valid"] = False
            result["errors"].append({
                "type": "FILE_NOT_FOUND",
                "message": f"File not found: {csv_path}"
            })
        except Exception as e:
            result["valid"] = False
            result["errors"].append({
                "type": "VALIDATION_ERROR",
                "message": f"Error during validation: {str(e)}"
            })

        return result

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python validate_nash.py <path_to_nash_csv>")
        sys.exit(1)

    csv_path = sys.argv[1]

    # Define path to CA stores
    base_dir = Path(__file__).parent.parent
    ca_stores_path = base_dir / 'States' / 'walmart_stores_ca_only.csv'

    if not ca_stores_path.exists():
        print(f"Error: CA stores file not found at {ca_stores_path}")
        print("Please run convert_stores.py first")
        sys.exit(1)

    # Create validator and validate
    validator = NashValidator(str(ca_stores_path))
    result = validator.validate(csv_path)

    # Output JSON report
    print("\n" + "="*60)
    print("VALIDATION REPORT")
    print("="*60)
    print(json.dumps(result, indent=2))
    print("="*60)

    # Exit with appropriate code
    if not result["valid"]:
        sys.exit(1)
    else:
        print("\nValidation PASSED")
        if result["warnings"]:
            print(f"(with {len(result['warnings'])} warnings)")
        sys.exit(0)

if __name__ == '__main__':
    main()
