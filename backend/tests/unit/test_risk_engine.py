import pytest
from app.services.risk_engine import RiskEngine

def test_risk_engine_normal():
    events = [
        {"event_type": "TAB_SWITCHED", "confidence": 1.0},
        {"event_type": "FULLSCREEN_EXIT", "confidence": 1.0}
    ]
    res = RiskEngine.calculate_risk_score(events)
    assert res["risk_score"] == 15.0
    assert res["risk_level"] == "NORMAL"

def test_risk_engine_critical():
    events = [
        {"event_type": "MULTIPLE_FACES", "confidence": 1.0},
        {"event_type": "PHONE_DETECTED", "confidence": 1.0},
        {"event_type": "AUDIO_VOICE_DETECTED", "confidence": 1.0}
    ]
    res = RiskEngine.calculate_risk_score(events)
    assert res["risk_score"] == 85.0
    assert res["risk_level"] == "CRITICAL"
