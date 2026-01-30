// Durak 🃏 Telegram Bot + Web App
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🎴 Welcome to Durak 🃏!\nPlay vs Bot or join online rooms!\nPress the button below 👇`,
    {
      reply_markup: {
        keyboard: [[
          { text: '🎴 Play', web_app: { url: `https://${process.env.RENDER_EXTERNAL_URL}/` } }
        ]],
        resize_keyboard: true
      }
    }
  );
});

console.log('Bot running...');

// Web App
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Web App running on port ${PORT}`);
});
