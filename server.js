// =========================
// Durak 🃏 Telegram Bot + WebSocket rooms
// =========================

// ВАЖЛИВО: встав свій токен тут або через ENV
const TOKEN = "8427633032:AAEi7uTgmjSRKS1kKuTXbw-lwjM02kT3yW0";

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram bot
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🎴 Welcome to Durak 🃏!\nPlay vs Bot or join friends in rooms!`,
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

console.log('Telegram bot running...');

// Serve Web App
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// WebSocket server for rooms
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

const rooms = {}; // roomCode -> [clients]

function generateRoomCode() {
  return Math.random().toString(36).substr(2,6).toUpperCase();
}

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let data;
    try { data = JSON.parse(message); } catch(e){ return; }

    if(data.type === 'createRoom') {
      const code = generateRoomCode();
      rooms[code] = [ws];
      ws.room = code;
      ws.send(JSON.stringify({ type:'roomCreated', code }));
    }

    if(data.type === 'joinRoom') {
      const code = data.code;
      if(rooms[code] && rooms[code].length < 2) {
        rooms[code].push(ws);
        ws.room = code;
        // notify both players
        rooms[code].forEach(c => c.send(JSON.stringify({ type:'startGame' })));
      } else {
        ws.send(JSON.stringify({ type:'error', message:'Room not available'}));
      }
    }

    if(data.type === 'playCard') {
      // send played card to other player
      const room = rooms[ws.room];
      if(room) {
        room.forEach(c => { if(c!==ws) c.send(JSON.stringify({ type:'opponentCard', card:data.card })); });
      }
    }
  });

  ws.on('close', () => {
    // remove from room
    if(ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter(c => c!==ws);
      if(rooms[ws.room].length === 0) delete rooms[ws.room];
    }
  });
});
