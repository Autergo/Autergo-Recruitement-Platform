from decimal import Decimal
from typing import List, Dict, Any

class RiskEngine:
    # Standard weighted penalty contributions per signal
    WEIGHTS = {
        "MULTIPLE_FACES": 35.0,
        "PHONE_DETECTED": 30.0,
        "AUDIO_VOICE_DETECTED": 20.0,
        "TAB_SWITCHED": 10.0,
        "FULLSCREEN_EXIT": 5.0,
        "FACE_ABSENT": 5.0,
        "CAMERA_DISCONNECTED": 15.0
    }

    @classmethod
    def calculate_risk_score(cls, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates aggregate suspicion score (0-100) and assigns risk bands.
        """
        raw_score = 0.0
        for ev in events:
            event_type = ev.get("event_type", "")
            confidence = float(ev.get("confidence", 1.0))
            base_weight = cls.WEIGHTS.get(event_type, 2.0)
            raw_score += base_weight * confidence

        # Cap between 0 and 100
        final_score = min(100.0, max(0.0, raw_score))

        if final_score <= 30.0:
            level = "NORMAL"
        elif final_score <= 60.0:
            level = "WATCH"
        elif final_score <= 80.0:
            level = "SUSPICIOUS"
        else:
            level = "CRITICAL"

        return {
            "risk_score": round(final_score, 2),
            "risk_level": level,
            "event_count": len(events)
        }
