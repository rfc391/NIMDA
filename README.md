
# NIMDA Project

NIMDA (National Intelligence Network Data Analyzer) is a web-based platform designed for intelligence management. It supports law enforcement, private security, and intelligence agencies by optimizing resources and enabling controlled information dissemination. NIMDA uses a military-grade, DARPA-compliant software framework designed for secure, efficient, and real-time operations. This project integrates cutting-edge technologies for AI, data transport, and secure storage.

## Features
- **EDA Framework**: Kafka, RabbitMQ for event-driven architecture.
- **AI Engine**: OpenCV, ONNX, NVIDIA Triton for real-time AI processing.
- **gRPC with Protobuf**: Low-latency communication between services.
- **Databases**:
  - Time-Series: InfluxDB for metrics and analytics.
  - Transactional: PostgreSQL for structured data.
  - Immutable Storage: immudb with IPFS for secure archival.
- **Security**: Zero Trust architecture and Quantum-Safe Encryption.
- **Performance Enhancements**: Cloudflare Workers and Redis caching.
- **Storage**: Decentralized storage using IPFS Cluster.

## Installation and Setup

### Prerequisites
- Docker and Docker Compose installed on your system.
- Python 3.8+ for backend scripts.
- Node.js for frontend components.

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/rfc391/NIMDA.git
   cd NIMDA
   ```

2. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend AI engine:
   ```bash
   python ai_engine.py
   ```

## Usage
- **AI Engine**:
  - Place your ONNX model in the project directory.
  - Use `AIEngine` class for predictions.

  Example:
  ```python
  from ai_engine import AIEngine

  engine = AIEngine("model.onnx")
  prediction = engine.predict("sample_image.jpg")
  print(prediction)
  ```

- **Web Interface**: Access the frontend via `http://localhost:3000`.

## Contributing
We welcome contributions. Please follow the [contribution guidelines](./CONTRIBUTING.md).

## License
This project is licensed under the [MIT License](./LICENSE).

## Security
Please review the [SECURITY.md](./SECURITY.md) file for details on security policies.

## Contact
For issues or feature requests, open an issue in the repository.
