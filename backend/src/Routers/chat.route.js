const express = require('express');
const { chat, getChats, getChat, deleteChat, updateChatTitle, toggleBookmark } = require('../controllers/chat.controller');
const { isLoggedIn } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/chat', isLoggedIn, chat);

router.get('/chats', isLoggedIn, getChats);

router.get('/chat/:chatId', isLoggedIn, getChat);

router.delete('/chat/:chatId', isLoggedIn, deleteChat);

router.put('/chat/:chatId/title', isLoggedIn, updateChatTitle);

router.put('/chat/:chatId/bookmark', isLoggedIn, toggleBookmark);

module.exports = router;
