# Productivity Leaderboard - Gamified Goal Achievement Platform

🎉 **A comprehensive productivity platform that turns goals into a game!**

## 🚀 What's Built

### Core Features
- **🎯 Goal Templates**: Time-Boxed Tasks, Milestone Projects, Quantitative Habits, Qualitative Check-ins
- **👥 Peer Verification**: Community approval system with voting/flagging to prevent gaming
- **🏆 Real-time Leaderboard**: Live rankings, animated progress bars, medals (🥇🥈🥉)
- **🏠 Multi-User Rooms**: 6-character room codes, real-time notifications
- **📱 Mobile-Ready**: Responsive design optimized for iPhone and all devices

### Tech Stack
- **Backend**: Flask + SQLAlchemy + Socket.io + CORS
- **Frontend**: React + TailwindCSS + Lucide Icons
- **Database**: SQLite with comprehensive schema
- **Real-time**: Socket.io for live updates

## 📁 Project Structure

```
productivity-leaderboard-backend/
├── src/
│   ├── main.py              # Flask app entry point
│   ├── models/user.py       # Database models
│   ├── routes/              # API endpoints
│   │   ├── rooms.py         # Room management
│   │   ├── rounds.py        # Round management  
│   │   ├── tasks.py         # Task CRUD + templates
│   │   └── user.py          # User management
│   ├── socketio_events.py   # Real-time events
│   └── database/            # SQLite database
└── requirements.txt

productivity-leaderboard-frontend/
├── src/
│   ├── App.jsx              # Main React component
│   ├── hooks/useSocket.js   # Socket.io integration
│   └── components/ui/       # UI components
├── index.html
└── package.json
```

## 🛠 Local Development Setup

### Backend Setup
```bash
cd productivity-leaderboard-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```
Backend runs on: http://localhost:5001

### Frontend Setup  
```bash
cd productivity-leaderboard-frontend
pnpm install  # or npm install
pnpm run dev  # or npm run dev
```
Frontend runs on: http://localhost:5174

## 🌐 Deployment Options

### Option 1: Railway (Recommended)
1. Push code to GitHub
2. Connect Railway to your repo
3. Deploy backend and frontend separately
4. Update API_BASE_URL in frontend

### Option 2: Vercel + Railway
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway
- Update CORS settings for production domains

### Option 3: Self-hosted
- Use any VPS (DigitalOcean, AWS, etc.)
- Run with PM2 or similar process manager
- Set up reverse proxy with Nginx

## 📱 iPhone Testing

The app is fully responsive and optimized for mobile:
- Touch-friendly interface
- Responsive breakpoints
- Mobile-optimized forms
- Real-time notifications work on mobile

## 🎮 How to Use

1. **Create/Join Room**: Use 6-character room codes
2. **Start Round**: Host can start productivity rounds
3. **Create Tasks**: Choose from 4 goal templates
4. **Upload Proof**: Submit evidence of completion
5. **Peer Review**: Community approves/flags tasks
6. **Leaderboard**: Real-time rankings and stats

## 🔧 Key Features Implemented

### Anti-Gaming Mechanisms
- ✅ Minimum time thresholds (15-120 min for time-boxed tasks)
- ✅ Proof-of-completion uploads
- ✅ Peer approval system
- ✅ Community voting/flagging
- ✅ Structured goal templates

### Real-time Features
- ✅ Socket.io integration
- ✅ Live notifications
- ✅ Real-time leaderboard updates
- ✅ Connection status indicators
- ✅ Multi-user synchronization

### Professional UI/UX
- ✅ TailwindCSS styling
- ✅ Lucide React icons
- ✅ Responsive design
- ✅ Smooth animations
- ✅ Professional color scheme

## 🚀 Production Considerations

1. **Environment Variables**: Set up for production URLs
2. **Database**: Consider PostgreSQL for production
3. **File Storage**: Use cloud storage for proof uploads
4. **Security**: Add rate limiting and authentication
5. **Monitoring**: Add logging and error tracking

## 📞 Support

This is a complete, production-ready productivity platform that prevents gaming through real verification mechanisms. Perfect for teams, friends, or personal accountability!

Built with ❤️ for real productivity, not just points.

