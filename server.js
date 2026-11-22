const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const upload = multer({storage: multer.memoryStorage(), limits:{fileSize:8*1024*1024}});
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/submit', upload.single('photo'), async (req,res) => {
  try {
    if (req.body.consent !== 'true') return res.status(400).json({error:'Не подтверждено согласие.'});
    if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({error:'На сервере не настроены BOT_TOKEN и CHAT_ID.'});
    const lat = req.body.latitude, lon = req.body.longitude;
    if (!req.file && (!lat || !lon)) return res.status(400).json({error:'Нет данных для отправки.'});

    if (req.file) {
      const form = new FormData();
      form.append('chat_id', CHAT_ID);
      form.append('photo', req.file.buffer, {filename:'selfie.jpg', contentType:req.file.mimetype});
      form.append('caption', 'VZON: пользователь добровольно отправил селфи через форму согласия.');
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {method:'POST', body:form, headers:form.getHeaders()});
      const j = await r.json();
      if (!j.ok) throw new Error(j.description || 'Telegram sendPhoto failed');
    }
    if (lat && lon) {
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:CHAT_ID, latitude:Number(lat), longitude:Number(lon)})
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.description || 'Telegram sendLocation failed');
    }
    res.json({ok:true});
  } catch (e) {
    console.error(e);
    res.status(502).json({error:'Не удалось передать данные в Telegram.'});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`VZON demo server listening on ${port}`));
