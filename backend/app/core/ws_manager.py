import uuid
from typing import Dict, Any, List
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        # drive_id -> set of WebSockets
        self.active_drives: Dict[str, List[WebSocket]] = {}

    async def connect(self, drive_id: str, websocket: WebSocket):
        await websocket.accept()
        if drive_id not in self.active_drives:
            self.active_drives[drive_id] = []
        self.active_drives[drive_id].append(websocket)

    def disconnect(self, drive_id: str, websocket: WebSocket):
        if drive_id in self.active_drives:
            if websocket in self.active_drives[drive_id]:
                self.active_drives[drive_id].remove(websocket)
            if not self.active_drives[drive_id]:
                del self.active_drives[drive_id]

    async def broadcast_to_drive(self, drive_id: str, event_type: str, data: Dict[str, Any]):
        if drive_id in self.active_drives:
            payload = {
                "event": event_type,
                "data": data
            }
            for connection in self.active_drives[drive_id]:
                try:
                    await connection.send_json(payload)
                except Exception:
                    pass

ws_manager = WebSocketManager()
