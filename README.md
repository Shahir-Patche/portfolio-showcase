# Portfolio Showcase: Shahir Khan

**Senior Software Engineer | IoT & Cloud Infrastructure**

This repository contains selected technical samples from my work at **Patche AI Inc.**, demonstrating my expertise in:

- **IoT & Edge Computing**: Secure data acquisition and processing.
- **Resilient Connectivity**: Offline-first synchronization engines.
- **Cloud Security**: Enterprise-grade Row Level Security (RLS) and Audit Logging.

> **Note**: These samples have been sanitized to remove proprietary business logic and secrets while preserving the architectural patterns and code quality.

## 📂 Repository Structure

| Component | technologies | Description |
|-----------|--------------|-------------|
| **[Enterprise Dashboard](./frontend/dashboard/EnterpriseDashboard.tsx)** | React, Recharts, Tailwind | **Real-time Analytics Dashboard** for Industrial clients. Features **Risk Radar**, anomaly visualization, and live activity feeds. |
| **[Edge Computing](./backend/edge-computing/mask-and-analyze.ts)** | TypeScript, Deno, WebAssembly | Simulates an IoT edge processing unit. Demonstrates **rate limiting**, **CORS security**, **input validation**, and **AI integration** for biometric telemetry. |
| **[Database Security](./backend/database/security_policies.sql)** | PostgreSQL, SQL, RLS | Governance policies ensuring strict **multi-tenant isolation**. Includes a **"Break Glass" protocol** for emergency access, mirroring industrial compliance standards. |
| **[Offline Sync Engine](./mobile-client/offline-sync/DataSyncManager.ts)** | TypeScript, React Native, Async Storage | A robust **store-and-forward** mechanism. Queues telemetry data when offline and synchronizes with exponential backoff reliability when connectivity is restored. |
| **[IoT Firmware (C++)](./firmware/sensor_node/main.cpp)** | C++, Arduino, MQTT/TLS | Embedded code for a secure biometric sensor node. Handles **WiFi provisioning**, **SSL encryption**, and **power management (Deep Sleep)**. |
| **[SCADA Tooling (C#)](./tools/scada_connector/HistorianClient.cs)** | C#, .NET, HTTP Client | A strongly-typed client for bridging cloud telemetry with legacy **Factory HMI** systems. |
| **[AI Analytics (Python)](./backend/analytics/anomaly_detection.py)** | Python, Pandas, NumPy | Statistical analysis backend for detecting sensor anomalies (Z-Score) and triggering **SCADA alarms**. |
| **[System Architecture](./architecture/system-diagram.mermaid)** | Mermaid.js | High-level diagram of the telemetry pipeline. |

## 🏗 System Architecture

The following diagram illustrates the high-level data flow from the edge device to the secure cloud historian.

![System Diagram](./architecture/system-diagram.mermaid)

## 🚀 Key Highlights

### 1. IoT Telemetry & Edge Processing

*File: `backend/edge-computing/mask-and-analyze.ts`*

- **Challenge**: Processing high-bandwidth sensor data (images/biometrics) without overwhelming the central server.
- **Solution**: Implemented an Edge Function that pre-validates and "masks" data closest to the user. It enforces strict privacy rules (sanitizing PII) before the data ever reaches the AI analysis layer.
- **Relevance**: Directly applicable to **Industrial IoT** where bandwidth is constrained and data privacy/security is paramount.

### 2. Enterprise Security & Governance

*File: `backend/database/security_policies.sql`*

- **Challenge**: ensuring that distinct tenants (users/patients) can NEVER access each other's data, even in the event of application-layer bugs.
- **Solution**: Implemented **Row Level Security (RLS)** at the database engine level.
- **"Break Glass" Feature**: Encoded a formal process for administrative overrides, ensuring that even "Super Admins" leave an immutable audit trail when accessing sensitive user data.

### 3. Resilient Offline Connectivity

*File: `mobile-client/offline-sync/DataSyncManager.ts`*

- **Challenge**: Maintaining data integrity in environments with spotty network coverage (e.g., factories, elevators, remote sites).
- **Solution**: Built a **Queue-based Synchronization Manager**. It persists actions locally (`AsyncStorage`) and intelligently retries them. It handles "soft failures" (network timeout) vs "hard failures" (validation error) differently to prevent queue blocking.

---

### 4. Real-Time Industrial Dashboard (Frontend)

*File: `frontend/dashboard/EnterpriseDashboard.tsx`*

- **Challenge**: visualizing complex, multi-tenant industrial data for C-Suite executives and plant managers in real-time.
- **Solution**: Built a **React/Tailwind** dashboard with **Recharts** for data visualization. Features a "Risk Radar" heatmap to instantly identify at-risk departments, and a "Live Pulse" feed (`frontend/components/ActivityPulse.tsx`) to show concurrent system activity.

### 5. Polyglot System Integration

*Files: `main.cpp`, `anomaly_detection.py`, `HistorianClient.cs`*

- **Embedded (C++)**: Secure MQTT firmware for biometric sensors, demonstrating low-level hardware control and power management.
- **Data Science (Python)**: Statistical backend service for detecting anomalies (Z-Score analysis) and triggering automated SCADA alarms.
- **Enterprise (C#)**: .NET client for bridging modern cloud telemetry with legacy factory HMI systems.

---

## 🛠 Tech Stack

- **Languages**: TypeScript, Python, C++, C#, SQL
- **Cloud/Infra**: Supabase (PostgreSQL), AWS Lambda / Edge Functions
- **Protocols**: REST, WebSocket, MQTT (pattern equivalents)
- **CI/CD**: GitHub Actions

---
*Contact: <shahirkhan13@gmail.com>*
