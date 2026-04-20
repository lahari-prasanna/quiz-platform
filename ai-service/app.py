from flask import Flask, request, jsonify
from groq import Groq
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

@app.route('/', methods=['GET'])
def health():
    return jsonify({"status": "AI Service is running!"})

@app.route('/generate', methods=['POST'])
def generate_questions():
    try:
        data = request.get_json(force=True)
        num_questions = data.get('num_questions', 5)
        text = data.get('text', '').strip()

        if not text or len(text) < 100:
            return jsonify({'error': 'Not enough text to generate questions'}), 400

        prompt = f"""You are an expert quiz generator. Your job is to create meaningful multiple choice questions STRICTLY based on the provided text content.

RULES:
1. Questions must be DIRECTLY based on information in the text
2. Do NOT create generic or unrelated questions
3. Each question must test understanding of specific facts, concepts, or ideas from the text
4. Options must be plausible but only ONE should be clearly correct based on the text
5. Generate exactly {num_questions} questions

Text content:
\"\"\"
{text}
\"\"\"

Return ONLY a valid JSON array, no other text:
[
  {{
    "question": "Specific question based on the text?",
    "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
    "answer": "A"
  }}
]"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000,
        )

        response_text = completion.choices[0].message.content.strip()
        print(f"AI response length: {len(response_text)}")

        start = response_text.find('[')
        end = response_text.rfind(']') + 1
        if start == -1 or end == 0:
            return jsonify({'error': 'AI could not generate valid questions'}), 500

        questions = json.loads(response_text[start:end])
        print(f"Generated {len(questions)} questions")
        return jsonify({'questions': questions})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
