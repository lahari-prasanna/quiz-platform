from flask import Flask, request, jsonify
from groq import Groq
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "AI Service is running!"})


@app.route("/generate", methods=["POST"])
def generate_questions():
    try:
        data = request.get_json(force=True)
        num_questions = data.get("num_questions", 5)
        text = data.get("text", "")

        if not text or len(text.strip()) < 100:
            return jsonify({"error": "No meaningful text provided"}), 400

        prompt = f"""You are a quiz generator. Based on the following text, generate exactly {num_questions} multiple choice questions.

Each question must have:
- A clear question based on the actual content
- Exactly 4 options labeled A), B), C), D)
- The correct answer as just the letter (A, B, C, or D)

Return ONLY a JSON array in this exact format, nothing else:
[
  {{
    "question": "Question text here?",
    "options": ["A) Option1", "B) Option2", "C) Option3", "D) Option4"],
    "answer": "A"
  }}
]

Text:
{text}"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000,
        )

        response_text = completion.choices[0].message.content.strip()
        print(f"🤖 AI response length: {len(response_text)}")

        start = response_text.find("[")
        end = response_text.rfind("]") + 1
        if start == -1 or end == 0:
            return jsonify({"error": "AI could not generate valid questions"}), 500

        questions = json.loads(response_text[start:end])
        print(f"Generated {len(questions)} questions")
        return jsonify({"questions": questions})

    except Exception as e:
        print(f" Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
