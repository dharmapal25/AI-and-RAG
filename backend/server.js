require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const connectDB = require('./src/config/db');
require('./auth/passport');

const authRouter = require('./src/Routers/auth.route');
const chatRouter = require('./src/Routers/chat.route');

const app = express();

// ✅ FIX 1: Trust Render's reverse proxy — SABSE PEHLE LAGAO
app.set('trust proxy', 1);

connectDB();

// ✅ FIX 2: CORS — sameSite:none ke liye credentials:true zaroori
app.use(cors({
  origin: [
    "https://flashgpt-ai.vercel.app",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/codex-sessions';

// ✅ FIX 3: MongoStore simplified — v4+ only
const sessionStore = MongoStore.create({
  mongoUrl,
  collectionName: 'sessions',
  ttl: 7 * 24 * 60 * 60 // 7 days in seconds
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    // ✅ FIX 4: sameSite 'none' — cross-origin (vercel ↔ render) ke liye
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ FIX 5: Debug route — test karne ke liye (baad mein hata dena)
app.get('/auth/check', (req, res) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null,
    sessionID: req.sessionID
  });
});

app.use('/auth', authRouter);
app.use('/api', chatRouter);

app.get('/', (req, res) => {
  res.send(`<h1>Home</h1><a href="/auth/google">Login with Google</a>`);
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});