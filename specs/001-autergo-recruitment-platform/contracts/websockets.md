# WebSocket & Real-Time Event Contracts: Autergo Platform

**Protocol**: WebSocket (WSS / WS)  
**Endpoint**: `/api/v1/ws/drives/{drive_id}/live` (Recruiter Command Center)  
**Endpoint**: `/api/v1/ws/assessment/{session_id}/stream` (Candidate Telemetry & Control)  
**Fallback Transport**: HTTP Long-Polling (`/api/v1/drives/{drive_id}/live/poll?since={timestamp}`)

---

## 1. Recruiter Command Center Stream

### Connection Handshake
- **URL**: `ws://localhost:8000/api/v1/ws/drives/{drive_id}/live`
- **Auth**: Query parameter token or header `Authorization: Bearer <recruiter_jwt>`

### Outbound Events (Server → Recruiter UI)

#### Event: `CANDIDATE_STATUS_UPDATE`
Emitted whenever a candidate transitions state.
```json
{
  "event": "CANDIDATE_STATUS_UPDATE",
  "timestamp": "2026-08-14T23:10:00Z",
  "data": {
    "candidate_id": "8b9e67d2-4321-4f10-9b81-a7b219e83120",
    "candidate_name": "Priya Sharma",
    "previous_status": "in_progress",
    "current_status": "submitted",
    "objective_score": 88.5,
    "current_risk_score": 14.0
  }
}
```

#### Event: `PROCTOR_ALERT`
Emitted immediately when high-severity or critical proctoring anomalies are ingested.
```json
{
  "event": "PROCTOR_ALERT",
  "timestamp": "2026-08-14T23:10:05Z",
  "data": {
    "candidate_id": "8b9e67d2-4321-4f10-9b81-a7b219e83120",
    "candidate_name": "Rohan Verma",
    "event_type": "MULTIPLE_FACES",
    "severity": "critical",
    "confidence": 0.94,
    "composite_risk_score": 75.0,
    "risk_level": "SUSPICIOUS",
    "evidence_media_url": "https://storage.autergo.com/evidence/snapshot_102.jpg"
  }
}
```

#### Event: `DRIVE_METRICS_SUMMARY`
Periodic heartbeat (every 5 seconds) aggregating live drive counters.
```json
{
  "event": "DRIVE_METRICS_SUMMARY",
  "timestamp": "2026-08-14T23:10:10Z",
  "data": {
    "total_invited": 2000,
    "started": 1842,
    "active_now": 1341,
    "completed": 501,
    "flagged_critical": 11,
    "flagged_suspicious": 21,
    "technical_issues": 6,
    "overall_completion_percentage": 84.2
  }
}
```

### Inbound Commands (Recruiter UI → Server)

#### Command: `DRIVE_CONTROL_ACTION`
```json
{
  "action": "TERMINATE_SESSION",
  "payload": {
    "candidate_id": "8b9e67d2-4321-4f10-9b81-a7b219e83120",
    "reason": "Confirmed multiple faces and phone violation"
  }
}
```

---

## 2. Candidate Telemetry & Control Stream

### Inbound Events (Candidate Client → Server)
```json
{
  "event": "TELEMETRY_HEARTBEAT",
  "data": {
    "client_timestamp": "2026-08-14T23:10:15Z",
    "tab_focused": true,
    "camera_active": true,
    "face_detected": true
  }
}
```

### Outbound Commands (Server → Candidate Client)
```json
{
  "command": "EXTEND_TIME",
  "payload": {
    "additional_seconds": 900,
    "reason": "Platform-wide 15 minute grace period extension"
  }
}
```
