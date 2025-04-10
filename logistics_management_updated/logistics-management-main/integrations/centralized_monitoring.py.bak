
# Centralized Monitoring Setup
from prometheus_client import start_http_server, Summary

class Monitoring:
    def __init__(self, port=8000):
        start_http_server(port)
        self.request_summary = Summary('request_processing_seconds', 'Time spent processing request')
    def track_request(self, duration):
        self.request_summary.observe(duration)
