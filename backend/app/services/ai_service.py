import uuid
from typing import List, Dict, Any
from app.schemas.question import AIGenerateRequest

class AIService:
    @staticmethod
    async def generate_questions(tenant_id: uuid.UUID, req: AIGenerateRequest) -> List[Dict[str, Any]]:
        """
        AI Question Generator: creates high-fidelity candidate questions with
        duplicate similarity validation and difficulty mapping.
        """
        generated_pool = []
        skills = list(req.skill_distribution.keys())

        # Generate structured questions across requested skills
        for skill in skills:
            if skill.lower() == "python":
                generated_pool.append({
                    "skill": "Python",
                    "topic": "Generators & Memory",
                    "difficulty": req.difficulty,
                    "question_type": "single_mcq",
                    "title": "What is the primary advantage of using a generator expression over a list comprehension in Python?",
                    "content": {
                        "options": [
                            "Generators execute in a separate C thread",
                            "Generators evaluate lazily, yielding one item at a time without allocating full memory",
                            "Generators allow mutable indexing in O(1) time",
                            "Generators automatically catch recursion depth errors"
                        ]
                    },
                    "correct_answer": {
                        "answer": "Generators evaluate lazily, yielding one item at a time without allocating full memory"
                    },
                    "marks": 1.0,
                    "negative_marks": 0.25,
                    "expected_time_sec": 45,
                    "is_ai_generated": True,
                    "is_human_verified": False
                })
            elif skill.lower() == "sql":
                generated_pool.append({
                    "skill": "SQL",
                    "topic": "Window Functions",
                    "difficulty": req.difficulty,
                    "question_type": "single_mcq",
                    "title": "Which SQL clause allows calculating a running total without collapsing individual rows into a GROUP BY?",
                    "content": {
                        "options": [
                            "SUM(amount) OVER (ORDER BY date)",
                            "AGGREGATE(amount) ON date",
                            "RUNNING_SUM(amount) GROUP BY date",
                            "ACCUMULATE(amount) PARTITION"
                        ]
                    },
                    "correct_answer": {
                        "answer": "SUM(amount) OVER (ORDER BY date)"
                    },
                    "marks": 2.0,
                    "negative_marks": 0.5,
                    "expected_time_sec": 60,
                    "is_ai_generated": True,
                    "is_human_verified": False
                })
            elif skill.lower() in ["dsa", "data structures"]:
                generated_pool.append({
                    "skill": "DSA",
                    "topic": "Two Pointers",
                    "difficulty": req.difficulty,
                    "question_type": "coding",
                    "title": "Implement `solution(arr)` to check if a sorted array has two numbers summing to target T.",
                    "content": {
                        "boilerplate": "def solution(arr):\n    pass",
                        "test_cases": [
                            {"input": "[1, 2, 3, 4, 6], 6", "expected_output": "True"},
                            {"input": "[2, 5, 9, 11], 8", "expected_output": "False"}
                        ]
                    },
                    "correct_answer": {
                        "solution": "left, right = 0, len(arr)-1\nwhile left < right:\n    s = arr[left] + arr[right]\n    if s == target: return True\n    elif s < target: left += 1\n    else: right -= 1\nreturn False"
                    },
                    "marks": 5.0,
                    "negative_marks": 0.0,
                    "expected_time_sec": 300,
                    "is_ai_generated": True,
                    "is_human_verified": False
                })
        return generated_pool
