
# Logistics Management

## Overview
The Logistics Management repository has been enhanced with new features to optimize operations and ensure secure collaboration.

### New Features
1. **AI-Driven Logistics Analysis**
    - Endpoint: `/analyze_logistics`
    - Method: `POST`
    - Description: Analyzes logistics reports for sentiment and insights.
    - Example Request:
      ```json
      {
          "logistics_report": "Inventory levels are critically low."
      }
      ```
    - Example Response:
      ```json
      {
          "analysis": [{"label": "NEGATIVE", "score": 0.95}]
      }
      ```

2. **Real-Time Monitoring**
    - Enables real-time communication for shipment and inventory updates using Flask-SocketIO.

3. **Geospatial Tracking**
    - Endpoint: `/track_shipment`
    - Method: `POST`
    - Description: Tracks and updates the geospatial location of shipments.
    - Example Request:
      ```json
      {
          "latitude": 34.05,
          "longitude": -118.25,
          "status": "In Transit"
      }
      ```
    - Example Response:
      ```json
      {
          "message": "Shipment location updated successfully",
          "shipment": {...}
      }
      ```

4. **Inventory Management**
    - Endpoint: `/inventory`
    - Method: `POST`
    - Description: Analyzes inventory data for insights and optimization.
    - Example Request:
      ```json
      {
          "inventory": [
              {"item": "Product A", "quantity": 50},
              {"item": "Product B", "quantity": 30}
          ]
      }
      ```
    - Example Response:
      ```json
      {
          "inventory_analysis": {...}
      }
      ```

### Getting Started
1. Install dependencies from `requirements.txt`:
    ```bash
    pip install -r requirements.txt
    ```
2. Run the application:
    ```bash
    python app.py
    ```
