const express = require('express');
const router = express.Router();

// Logik für alle Routen
router.use((req, res, next) => {
  // console.log('Eine Anfrage wurde empfangen.');
  next();
});

// Allgemeine Route
router.get('/', (req, res) => {
  res.send('Willkommen bei meiner API!');
});

// User Route
const userRoute = require('./routes/user');
router.use('/user', userRoute);

// Poll Route
const pollRoute = require('./routes/poll');
router.use('/poll', pollRoute);

// Vote Route
const voteRoute = require('./routes/vote');
router.use('/vote', voteRoute);

// Lack Route
const lackRoute = require('./routes/lack');
router.use('/lack', lackRoute);

module.exports = router;
