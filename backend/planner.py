from ollama import chat


def create_plan(task: str, model: str = "qwen3:4b") -> str:

    planner_prompt = """
You are ORVYN's task planner.

Your job is to turn a user's complex request into a
clear, practical list of steps.

Rules:

1. Understand the user's goal.
2. Break large tasks into smaller steps.
3. Keep each step clear and actionable.
4. Do not write the actual code yet.
5. Do not claim that you completed the task.
6. Return only the plan.
7. For software projects, include planning, development,
   testing, and final verification.
"""

    response = chat(
        model=model,
        messages=[
            {
                "role": "system",
                "content": planner_prompt
            },
            {
                "role": "user",
                "content": task
            }
        ]
    )

    return response.message.content