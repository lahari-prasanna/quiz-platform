from groq import Groq
import json, os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def generate_questions(text, num_questions=5):
    prompt = f'''You are a quiz maker. Read the following text and create {num_questions} multiple-choice questions.
Return ONLY a valid JSON array, no extra text, like this:
[
  {{
    "question": "What is...",
    "options": ["A. Option1", "B. Option2", "C. Option3", "D. Option4"],
    "answer": "A",
    "topic": "topic name"
  }}
]

Text: {text[:3000]}
'''
    response = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[{'role': 'user', 'content': prompt}],
        temperature=0.7
    )
    raw = response.choices[0].message.content.strip()
    # Remove markdown code blocks if model adds them
    if raw.startswith('```'):
        raw = raw.split('```')[1]
        if raw.startswith('json'):
            raw = raw[4:]
    return json.loads(raw)
