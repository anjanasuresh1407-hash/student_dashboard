import os
import json
from datetime import datetime
import anthropic

ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

client = anthropic.Client(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None


def _format_datetime(value):
    try:
        return value.strftime('%a, %d %b %Y at %I:%M %p')
    except Exception:
        return str(value)


def get_ai_priority(tasks, exams):
    items = []
    if tasks:
        items.append('Tasks:')
        for task in tasks:
            items.append(f"- {task.title} | Deadline: {_format_datetime(task.deadline)} | Priority: {task.priority}")
    if exams:
        items.append('Exams:')
        for exam in exams:
            items.append(f"- {exam.subject} | Date: {_format_datetime(exam.exam_date)}")
    prompt_body = '\n'.join(items) if items else 'No pending tasks or exams.'

    system_prompt = (
        "You are a smart academic assistant helping a student prioritize their workload. "
        "Be concise and practical."
    )
    user_prompt = (
        "Here are my pending tasks and upcoming exams:\n"
        f"{prompt_body}\n"
        "Generate a prioritized action plan with a maximum of 8 items."
        " Return ONLY a valid JSON array. Each item must have:"
        " rank (integer), item (string), type ('task' or 'exam'), reason (one sentence)."
        " No markdown, no explanation outside the JSON array."
    )

    try:
        if not client:
            raise RuntimeError('Anthropic client not configured')

        response = client.completions.create(
            model='claude-sonnet-4-6',
            prompt=f"{system_prompt}\n\n{user_prompt}",
            max_tokens_to_sample=500,
            temperature=0.2,
        )
        content = response.get('completion') or response.get('text') or ''
        content = content.strip()
        if not content:
            raise ValueError('Empty AI response')
        result = json.loads(content)
        if isinstance(result, list):
            return result
        raise ValueError('AI returned non-list JSON')
    except Exception:
        fallback = []
        combined = []
        for task in tasks:
            combined.append({
                'item': task.title,
                'type': 'task',
                'date': task.deadline,
                'reason': 'Sorted by deadline',
            })
        for exam in exams:
            combined.append({
                'item': exam.subject,
                'type': 'exam',
                'date': exam.exam_date,
                'reason': 'Sorted by deadline',
            })
        combined.sort(key=lambda x: x['date'] if x['date'] else datetime.max)
        for idx, entry in enumerate(combined, start=1):
            fallback.append({
                'rank': idx,
                'item': entry['item'],
                'type': entry['type'],
                'reason': entry['reason'],
            })
        return fallback
