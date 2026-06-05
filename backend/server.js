// server.js

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');

const app = express();

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());


app.get('/', (req, res) => {
  res.send(`
        <h1>Home</h1>
        <a href="/auth/google">Login with Google</a>
        `);
});



app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
})
