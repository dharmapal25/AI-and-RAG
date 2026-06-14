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

app.use(cors({
  origin: "https://flashgpt-ai.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
})); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// create a session store compatible with multiple connect-mongo versions
const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/codex-sessions';
let sessionStore = null;
try {
  if (MongoStore && typeof MongoStore.create === 'function') {
    // modern API (connect-mongo v4+)
    sessionStore = MongoStore.create({ mongoUrl, collectionName: 'sessions' });
  } else if (typeof MongoStore === 'function') {
    // older API: require('connect-mongo')(session)
    const MongoStoreFactory = MongoStore(session);
    sessionStore = new MongoStoreFactory({ url: mongoUrl, collection: 'sessions' });
  }
} catch (err) {
  console.warn('Failed to create Mongo session store:', err);
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore || undefined,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
     sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
     // avoid explicit domain to let the browser scope cookie to the response host
     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/api', chatRouter);

app.get('/', (req, res) => {
  res.send(`
    <h1>Home</h1>
    <a href="/auth/google">Login with Google</a>
  `);
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
})
