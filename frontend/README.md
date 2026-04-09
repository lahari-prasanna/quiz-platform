# 🎓 AI-Powered Real-Time Quiz Platform

A full-stack web application that automatically generates quiz questions from PDF content using AI, and conducts live interactive quiz sessions with real-time leaderboards.

## 👥 Team

- D. Lahari Prasanna (R210019)
- R. Harshitha (R210478)

**Guide:** Mr. P. Santhosh Kumar, Assistant Professor  
**Institution:** RGUKT RK Valley — CSE Department

---

## 🚀 Features

### Teacher

- Upload PDF → AI auto-generates MCQ questions
- Create live session with unique code
- Broadcast questions in real time
- View live leaderboard
- Analytics dashboard with charts

### Student

- Join session with code
- Answer questions with 30-second timer
- See instant correct/wrong feedback
- Live leaderboard ranking

---

## 🛠️ Tech Stack

| Layer      | Technology                      |
| ---------- | ------------------------------- |
| Frontend   | React.js, Socket.IO Client      |
| Backend    | Node.js, Express.js             |
| AI Service | Python, Flask, Groq (LLaMA 3.3) |
| Database   | MongoDB                         |
| Real-Time  | Socket.IO (WebSockets)          |
| Auth       | JWT + bcrypt                    |

---

## ⚙️ How to Run

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

### 2. AI Service

```bash
cd ai-service
pip install -r requirements.txt
python3 app.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

### Environment Variables

**backend/.env**

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/quizplatform
JWT_SECRET=your_secret_key
AI_SERVICE_URL=http://localhost:8000
```

**ai-service/.env**

```
GROQ_API_KEY=your_groq_api_key
```

---

## 📱 Usage Flow

1. Teacher registers → uploads PDF → AI generates questions
2. Teacher starts session → shares 6-character code
3. Students join using code
4. Teacher broadcasts questions live
5. Students answer within 30 seconds
6. Real-time leaderboard updates
7. Teacher ends session → analytics available
