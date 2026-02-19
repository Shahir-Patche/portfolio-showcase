"""
Data Analytics Service: Anomaly Detection
Author: Shahir Khan

This service simulates a backend worker that:
1. Connects to the primary PostgreSQL Historian.
2. Fetches time-series telemetry data (temperature, vibration, pressure).
3. Uses a statistical model (Z-Score / Isolation Forest mockup) to detect anomalies.
4. Flags anomalous readings for review in the SCADA dashboard.

Dependencies:
    - pandas: Data manipulation
    - sqlalchemy: Database ORM
    - numpy: Numerical operations
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict

# Mocking external libraries for portability in this portfolio sample
# In production: import pandas as pd, numpy as np
class MockPandas:
    def DataFrame(self, data): return data

pd = MockPandas()

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("AnomalyDetector")

class TelemetryAnalyzer:
    def __init__(self, db_connection_string: str):
        self.db_url = db_connection_string
        self.anomaly_threshold = 3.0  # Z-Score threshold

    def fetch_telemetry(self, device_id: str, minutes: int = 60) -> List[Dict]:
        """
        Simulates fetching the last N minutes of telemetry for a device.
        """
        logger.info(f"Fetching data for device {device_id}...")
        # Simulation of DB query
        # SELECT * FROM telemetry WHERE device_id = %s AND timestamp > NOW() - INTERVAL '%s minutes'
        return [
            {"timestamp": datetime.now(), "value": 98.6},
            {"timestamp": datetime.now(), "value": 99.1},
            {"timestamp": datetime.now(), "value": 105.4}, # Anomaly
            {"timestamp": datetime.now(), "value": 98.2},
        ]

    def detect_anomalies(self, data: List[Dict]) -> List[Dict]:
        """
        Identifies data points that deviate significantly from the norm.
        Uses a Z-score algorithm: (Value - Mean) / StdDev
        """
        values = [d['value'] for d in data]
        if not values:
            return []

        # Calculate basic stats (manual implementation to avoid heavy deps in sample)
        mean = sum(values) / len(values)
        variance = sum([((x - mean) ** 2) for x in values]) / len(values)
        std_dev = variance ** 0.5
        
        anomalies = []
        for reading in data:
            z_score = (reading['value'] - mean) / std_dev if std_dev > 0 else 0
            if abs(z_score) > self.anomaly_threshold:
                reading['z_score'] = z_score
                reading['severity'] = 'CRITICAL' if abs(z_score) > 5 else 'WARNING'
                anomalies.append(reading)
                
        return anomalies

    def alert_scada_system(self, anomalies: List[Dict]):
        """
        Pushes alerts to the central MQTT broker for SCADA consumption.
        """
        for anomaly in anomalies:
            payload = {
                "type": "ANOMALY_DETECTED",
                "device_id": "SENSOR_001",
                "value": anomaly['value'],
                "severity": anomaly['severity'],
                "timestamp": str(anomaly['timestamp'])
            }
            # mqtt_client.publish("alarms/process_control", json.dumps(payload))
            logger.warning(f"ALARM PUBLISHED: {json.dumps(payload)}")

if __name__ == "__main__":
    # Example Execution
    db_uri = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/historian")
    analyzer = TelemetryAnalyzer(db_uri)
    
    raw_data = analyzer.fetch_telemetry("SENSOR_001")
    detected_issues = analyzer.detect_anomalies(raw_data)
    
    if detected_issues:
        logger.info(f"Detected {len(detected_issues)} anomalies.")
        analyzer.alert_scada_system(detected_issues)
    else:
        logger.info("System nominal.")
