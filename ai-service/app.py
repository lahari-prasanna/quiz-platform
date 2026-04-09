from flask import Flask, request, jsonify
from groq import Groq
import PyPDF2
import os
import requests
import tempfile
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def extract_text_from_path(file_path):
    text = ""
    with open(file_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text

def extract_text_from_url(file_url):
    headers = {
        'User-Agent': 'Mozilla/5.0',
    }
    response = requests.get(file_url, headers=headers, timeout=30)
    response.raise_for_status()
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        tmp.write(response.content)
        tmp_path = tmp.name
    try:
        text = extract_text_from_path(tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except:
            pass
    return text

@app.route('/', methods=['GET'])
def health():
    return jsonify({"status": "AI Service is running!"})

@app.route('/generate', methods=['POST'])
def generate_questions():
    try:
        data = request.get_json(force=True)
        num_questions = data.get('num_questions', 5)

        text = ""
        if data.get('file_url'):
            print(f"📥 Downloading from URL: {data['file_url']}")
            text = extract_text_from_url(data['file_url'])
        elif data.get('file_path'):
            print(f"📂 Reading from path: {data['file_path']}")
            text = extract_text_from_path(data['file_path'])
        else:
            return jsonify({'error': 'No file_url or file_path provided'}), 400

        print(f"📄 Extracted text length: {len(text)}")

        if not text.strip():
            return jsonify({'error': 'Could not extract text from PDF'}), 400

        prompt = f"""You are a quiz generator. Based on the following text, generate exactly {num_questions} multiple choice questions.

Each question must have:
- A clear question
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

Text to generate questions from:
{text[:4000]}"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000,
        )

        response_text = completion.choices[0].message.content.strip()
        print(f"🤖 AI Response: {response_text[:200]}")

        start = response_text.find('[')
        end = response_text.rfind(']') + 1
        if start == -1 or end == 0:
            return jsonify({'error': 'Invalid response from AI'}), 500

        questions = json.loads(response_text[start:end])
        print(f"✅ Generated {len(questions)} questions")
        return jsonify({'questions': questions})

    except requests.exceptions.RequestException as e:
        print(f"❌ Download error: {str(e)}")
        return jsonify({'error': f'Failed to download PDF: {str(e)}'}), 500
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
