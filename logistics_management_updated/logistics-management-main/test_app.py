
import unittest
from app import app

class LogisticsManagementTests(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_home(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn("Logistics Management", response.get_json()["message"])

    def test_analyze_logistics(self):
        response = self.app.post('/analyze_logistics', json={"logistics_report": "Critical shortage of supplies."})
        self.assertEqual(response.status_code, 200)
        self.assertIn("analysis", response.get_json())

    def test_track_shipment(self):
        shipment_data = {"latitude": 34.05, "longitude": -118.25, "status": "Delivered"}
        response = self.app.post('/track_shipment', json=shipment_data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.get_json())

    def test_inventory_management(self):
        inventory_data = {"inventory": [{"item": "Product A", "quantity": 50}, {"item": "Product B", "quantity": 30}]}
        response = self.app.post('/inventory', json=inventory_data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("inventory_analysis", response.get_json())

if __name__ == '__main__':
    unittest.main()
