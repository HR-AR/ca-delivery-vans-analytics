#!/usr/bin/env python3
"""
Unit tests for Phase 3 analysis scripts.
"""

import unittest
import pandas as pd
import json
import os
from scripts.analysis import (
    load_ca_stores,
    filter_ca_stores,
    calculate_otd_percentage,
    normalize_carrier_name,
    PROJECT_ROOT
)
from scripts.analysis.dashboard import calculate_dashboard_metrics
from scripts.analysis.cpd_analysis import calculate_van_cpd, compare_cpd
from scripts.analysis.store_analysis import analyze_store
from scripts.analysis.vendor_analysis import analyze_vendors
from scripts.analysis.batch_analysis import analyze_batch_density, batch_size_distribution
from scripts.analysis.performance import calculate_performance_metrics


class TestUtilities(unittest.TestCase):
    """Test common utility functions."""

    def test_load_ca_stores(self):
        """Test loading CA store list."""
        stores = load_ca_stores()
        self.assertIsInstance(stores, list)
        self.assertGreater(len(stores), 0)
        # Check that known CA store exists
        self.assertIn('2082', stores)

    def test_normalize_carrier_name(self):
        """Test carrier name normalization."""
        self.assertEqual(normalize_carrier_name('Fox-Drop'), 'FOX')
        self.assertEqual(normalize_carrier_name('NTG'), 'NTG')
        self.assertEqual(normalize_carrier_name('FRONTDoor Collective'), 'FDC')
        self.assertEqual(normalize_carrier_name('DeliverOL'), 'DeliverOL')  # No match

    def test_calculate_otd_percentage(self):
        """Test OTD percentage calculation."""
        # Create sample dataframe
        df = pd.DataFrame({
            'Is Pickup Arrived Ontime': [1, 1, 0, 1, 0]
        })
        otd = calculate_otd_percentage(df)
        self.assertEqual(otd, 60.0)  # 3 out of 5 = 60%


class TestCPDCalculation(unittest.TestCase):
    """Test CPD calculation logic."""

    def setUp(self):
        """Set up test data."""
        self.rate_card_fox = {
            'base_rate_80': 380.00,
            'base_rate_100': 390.00,
            'contractual_adjustment': 1.00
        }

    def test_cpd_80_orders(self):
        """Test CPD calculation for batch size 80."""
        trip_data = {}
        cpd = calculate_van_cpd(trip_data, self.rate_card_fox, 80)
        expected = 380.00 / 80  # = 4.75
        self.assertAlmostEqual(cpd, expected, places=2)

    def test_cpd_100_orders(self):
        """Test CPD calculation for batch size 100."""
        trip_data = {}
        cpd = calculate_van_cpd(trip_data, self.rate_card_fox, 100)
        expected = 390.00 / 100  # = 3.90
        self.assertAlmostEqual(cpd, expected, places=2)

    def test_cpd_90_orders(self):
        """Test CPD calculation for batch size 90 (uses base_rate_100)."""
        trip_data = {}
        cpd = calculate_van_cpd(trip_data, self.rate_card_fox, 90)
        expected = 390.00 / 90  # = 4.33
        self.assertAlmostEqual(cpd, expected, places=2)


class TestAnalysisScripts(unittest.TestCase):
    """Test analysis scripts with sample data."""

    @classmethod
    def setUpClass(cls):
        """Load test data once for all tests."""
        # Load Nash data
        nash_path = os.path.join(PROJECT_ROOT, 'Data Example', 'data_table_1 (2).csv')
        cls.nash_df = pd.read_csv(nash_path)
        cls.nash_df['Store Id'] = cls.nash_df['Store Id'].astype(str)

        # Load store registry
        registry_path = os.path.join(PROJECT_ROOT, 'data', 'ca_store_registry.json')
        with open(registry_path, 'r') as f:
            cls.store_registry = json.load(f)

        # Load rate cards
        rates_path = os.path.join(PROJECT_ROOT, 'data', 'ca_rate_cards.json')
        with open(rates_path, 'r') as f:
            cls.rate_cards = json.load(f)

    def test_dashboard_metrics(self):
        """Test dashboard metrics calculation."""
        metrics = calculate_dashboard_metrics(
            self.nash_df, self.store_registry, self.rate_cards
        )

        # Verify structure
        self.assertIn('total_orders', metrics)
        self.assertIn('total_trips', metrics)
        self.assertIn('avg_van_cpd', metrics)
        self.assertIn('otd_percentage', metrics)
        self.assertIn('carriers', metrics)

        # Verify types
        self.assertIsInstance(metrics['total_orders'], int)
        self.assertIsInstance(metrics['avg_van_cpd'], float)
        self.assertIsInstance(metrics['carriers'], list)

        # Verify values are reasonable
        self.assertGreaterEqual(metrics['total_orders'], 0)
        self.assertGreaterEqual(metrics['avg_van_cpd'], 0)

    def test_store_analysis(self):
        """Test store-level analysis."""
        # Test with store 2082 if it exists in data
        store_id = '2082'
        metrics = analyze_store(
            store_id, self.nash_df, self.store_registry, self.rate_cards
        )

        # Verify structure
        self.assertIn('store_id', metrics)
        self.assertIn('total_orders', metrics)
        self.assertIn('van_cpd', metrics)
        self.assertIn('otd_percentage', metrics)
        self.assertIn('date_range', metrics)

        # Verify store ID matches
        self.assertEqual(metrics['store_id'], store_id)

    def test_vendor_analysis(self):
        """Test vendor performance comparison."""
        vendor_metrics = analyze_vendors(self.nash_df, self.rate_cards)

        # Should have at least one vendor
        self.assertGreater(len(vendor_metrics), 0)

        # Check structure for each vendor
        for vendor, metrics in vendor_metrics.items():
            self.assertIn('total_trips', metrics)
            self.assertIn('total_orders', metrics)
            self.assertIn('avg_cpd', metrics)
            self.assertIn('otd_percentage', metrics)
            self.assertIn('drops_per_hour', metrics)

    def test_batch_analysis(self):
        """Test batch density analysis."""
        batch_analysis = analyze_batch_density(self.nash_df, self.store_registry)

        # Verify structure
        self.assertIn('stores', batch_analysis)
        self.assertIn('overall', batch_analysis)

        # Verify overall metrics
        overall = batch_analysis['overall']
        self.assertIn('avg_batch_size', overall)
        self.assertIn('avg_target', overall)
        self.assertIn('achievement', overall)

    def test_batch_distribution(self):
        """Test batch size distribution."""
        distribution = batch_size_distribution(self.nash_df)

        # Verify structure
        self.assertIn('min', distribution)
        self.assertIn('max', distribution)
        self.assertIn('mean', distribution)
        self.assertIn('ranges', distribution)

        # Verify ranges structure
        ranges = distribution['ranges']
        self.assertIn('0-50', ranges)
        self.assertIn('50-80', ranges)
        self.assertIn('80-100', ranges)
        self.assertIn('100+', ranges)

    def test_performance_metrics(self):
        """Test performance metrics calculation."""
        performance = calculate_performance_metrics(self.nash_df)

        # Verify structure
        self.assertIn('timing', performance)
        self.assertIn('efficiency', performance)
        self.assertIn('delivery', performance)

        # Verify timing metrics
        timing = performance['timing']
        self.assertIn('avg_driver_dwell_time', timing)
        self.assertIn('avg_load_time', timing)

        # Verify efficiency metrics
        efficiency = performance['efficiency']
        self.assertIn('drops_per_hour_trip', efficiency)
        self.assertIn('failed_orders_rate', efficiency)

        # Verify delivery metrics
        delivery = performance['delivery']
        self.assertIn('delivered_orders', delivery)
        self.assertIn('otd_percentage', delivery)


class TestDataQuality(unittest.TestCase):
    """Test data quality and edge cases."""

    def test_empty_dataframe(self):
        """Test handling of empty dataframe."""
        empty_df = pd.DataFrame()
        rate_cards = {'vendors': {}}
        store_registry = {'stores': {}}

        metrics = calculate_dashboard_metrics(empty_df, store_registry, rate_cards)

        # Should return zero values, not crash
        self.assertEqual(metrics['total_orders'], 0)
        self.assertEqual(metrics['total_trips'], 0)

    def test_missing_columns(self):
        """Test handling of missing columns."""
        # Create dataframe with minimal columns
        df = pd.DataFrame({
            'Store Id': ['2082'],
            'Total Orders': [50]
        })

        # Should not crash
        from scripts.analysis import safe_sum
        total = safe_sum(df['Total Orders'])
        self.assertEqual(total, 50.0)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
