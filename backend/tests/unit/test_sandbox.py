import pytest
from app.services.sandbox_service import SandboxService

@pytest.mark.asyncio
async def test_python_sandbox_execution():
    code = """
def solution(inp):
    return inp[::-1]
"""
    test_cases = [
        {"input": "hello", "expected_output": "olleh"},
        {"input": "autergo", "expected_output": "ogretua"}
    ]
    res = await SandboxService.execute_code("python", code, test_cases)
    assert res["total_test_cases"] == 2
    assert res["passed_test_cases"] == 2
    assert res["all_passed"] is True
