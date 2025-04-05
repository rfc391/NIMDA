
# 🧠 NIMDA – Network Intelligence & Monitoring Dashboard with AI

**NIMDA** is a fully integrated, cross-platform, AI-powered cyber operations dashboard. Built with cutting-edge technologies including React, TypeScript, Python, and WebSocket integration, NIMDA offers real-time insights, anomaly detection, and automated intelligence analysis in a compact and deployable package.

---

## 🚀 Features

- 🎛️ Dynamic React Dashboard with Dark Mode
- 🔐 Built-in Authentication & Role-Based Access
- 🧠 AI Engine (Python) for automated recon and data analysis
- 📡 Real-Time Alerts and Notifications
- 📦 Offline-compatible via `.AppImage`, `.exe`, `.deb`
- 🧪 Full test suite (Jest + Pytest)
- 📊 Integrated logging, charts, and analytics
- ☁️ Cloudflare cache purge automation
- 🐳 Docker & CI/CD ready

---

## 💻 Installation

### 🔗 From Source

```bash
git clone https://github.com/rfc391/NIMDA.git
cd NIMDA
npm install
npm run dev
```

### 📦 Install Packages

```bash
pip install -r requirements.txt
```

### 🔌 Run Backend AI Engine

```bash
python3 main.py
```

---

## 🖥️ Cross-Platform Executables

Prebuilt versions available under [Releases](https://github.com/rfc391/NIMDA/releases):

| OS      | Format     |
|---------|------------|
| Linux   | `.AppImage`, `.deb` |
| Windows | `.exe`     |
| macOS   | (coming soon) |

---

## 🧪 Testing

```bash
# React tests
npm run test

# Python AI module
pytest tests/
```

---

## 🛠️ Developer Notes

- Written in React + TypeScript (frontend)
- Python + WebSockets for AI backend
- TailwindCSS for UI styling
- Docker-ready with `docker-compose.yml`
- Uses Vite for blazing-fast development

---

## 🧰 File Structure

```bash
📁 src/                # React components
📁 server/             # WebSocket server & backend
📁 scripts/            # Automation & deployment tools
📁 docs/               # Extended documentation
main.py                # AI engine
setup.py               # Python packaging
Dockerfile             # For containerized deployment
```

---

## 🧑‍💻 Contributors

Maintained by [`rfc391`](https://github.com/rfc391) and the Apex Security Int Ltd team.

---

## 📜 License

This project is licensed under the MIT License.
