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

connectDB();

// IMPORTANT FOR RENDER
app.set("trust proxy", 1);

app.use(cors({
  origin: "https://flashgpt-ai.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: "sessions"
});

app.use(session({
  name: "connect.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,

  cookie: {
    httpOnly: true,

    // Production Render
    secure: true,

    // VERY IMPORTANT
    sameSite: "none",

    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/api', chatRouter);

app.get('/', (req, res) => {
  res.send('Backend Running');
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
});