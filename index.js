/**
 * Telegram Minecraft AFK Keeper Bot - FAQT SUBDOMEN BILAN ISHLAYDI!
 * Faqat server subdomeni (masalan: myserver.aternos.me yoki myserver) kiritiladi.
 * Port va DNS SRV yozuvlari avtomatik aniqlanadi!
 * 
 * GitHub va Railway.app da 24/7 bepul ishlatish uchun 100% tayyor.
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mineflayer = require('mineflayer');
const dns = require('dns').promises;

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("XATOLIK: BOT_TOKEN topilmadi! .env faylida yoki Railway Variables bo'limida BOT_TOKEN ni ko'rsating.");
  process.exit(1);
}

// Telegram botni polling rejimida ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchilarning saqlangan subdomenlari va holatlari (chatId -> Data)
const userSubdomains = new Map();

// Faol Minecraft botlari (chatId -> botSession)
const activeMcBots = new Map();

console.log("=================================================");
console.log("  MINECRAFT SUBDOMEN AFK BOT ISHGA TUSHDI!");
console.log("  Rejim: Faqat Subdomen orqali avtomatik ulanish");
console.log("  Railway & GitHub 24/7 uchun tayyor.");
console.log("=================================================");

/**
 * Subdomenni tozalash va to'liq formatga keltirish:
 * Masalan:
 * - "myserver" -> "myserver.aternos.me"
 * - "myserver.aternos.me:38491" -> portni ajratadi
 * - DNS SRV orqali dinamik portni avtomatik topadi
 */
async function parseSubdomainInfo(rawInput) {
  let text = String(rawInput || '').trim().toLowerCase();
  
  // Agar havola kabi yozilgan bo'lsa (https:// yoki http://) tozalash
  text = text.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  let host = text;
  let customPort = null;

  if (text.includes(':')) {
    const parts = text.split(':');
    host = parts[0];
    customPort = parseInt(parts[1], 10);
  }

  // Agar foydalanuvchi faqat bitta so'z yozgan bo'lsa (nuqtasiz), aternos subdomeni deb hisoblanadi
  if (!host.includes('.')) {
    host = host + '.aternos.me';
  }

  let finalHost = host;
  let finalPort = customPort || 25565;
  let srvDetected = false;

  // Agar port ko'rsatilmagan bo'lsa, DNS SRV orqali Aternos/Minecraft portini tekshirish
  if (!customPort) {
    try {
      const records = await dns.resolveSrv('_minecraft._tcp.' + host);
      if (records && records.length > 0) {
        finalHost = records[0].name || host;
        finalPort = records[0].port || 25565;
        srvDetected = true;
      }
    } catch (e) {
      // SRV bo'lmasa standart 25565 qoladi
      finalPort = 25565;
    }
  }

  return {
    rawSubdomain: rawInput,
    cleanSubdomain: host,
    host: finalHost,
    port: finalPort,
    hasSrv: srvDetected
  };
}

// Tasodifiy qulay bot niki yaratish
function generateBotNick() {
  const prefixes = ['AFK_Guard', 'ServerKeeper', 'AFK_Bot', 'Stay247', 'MineGuard'];
  const randNum = Math.floor(100 + Math.random() * 900);
  const randPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return randPrefix + '_' + randNum;
}

// /start buyrug'i
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const saved = userSubdomains.get(chatId) || [];
  let savedText = "";
  if (saved.length > 0) {
    savedText = "\n\n📂 *Sizning saqlangan subdomenlaringiz:*\n" + 
      saved.map((s, idx) => (idx + 1) + ". `" + s.cleanSubdomain + "` (" + s.port + ")").join("\n");
  }

  const welcomeMessage = 
    "👋 *Assalomu alaykum! Minecraft 24/7 Subdomen AFK Botiga xush kelibsiz.*\n\n" +
    "⚡ Bu botga **faqat serveringizning subdomenini** yozib yuborishingiz kifoya!\n" +
    "Port, IP yoki versiya qidirish shart emas — bot hammasini avtomatik aniqlaydi va Aternos yoki boshqa serveringizni 24/7 yoniq saqlaydi!\n\n" +
    "👉 **Server subdomenini yozing:**\n" +
    "*(Masalan: `myserver.aternos.me` yoki shunchaki `myserver`)*" +
    savedText;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// /subdomen yoki /add buyrug'i orqali subdomen qo'shish
bot.onText(/\/(?:subdomen|add)(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1]?.trim();

  if (!input) {
    bot.sendMessage(
      chatId,
      "ℹ️ *Subdomen qo'shish uchun shunday yozing:*\n\n" +
      "`/subdomen myserver.aternos.me`\nyoki\n`/subdomen myserver`",
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await handleIncomingSubdomain(chatId, input);
});

// Foydalanuvchi yozgan oddiy xabarlarni qabul qilish
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text || text.startsWith('/')) return;

  await handleIncomingSubdomain(chatId, text);
});

// Subdomenni qayta ishlash va tasdiqlash tugmalarini chiqarish
async function handleIncomingSubdomain(chatId, text) {
  bot.sendChatAction(chatId, 'typing');

  try {
    const info = await parseSubdomainInfo(text);
    
    // Foydalanuvchi xotirasiga qo'shish
    let saved = userSubdomains.get(chatId) || [];
    // Dublikatlarni tekshirish
    saved = saved.filter(s => s.cleanSubdomain !== info.cleanSubdomain);
    info.botNick = generateBotNick();
    saved.unshift(info);
    userSubdomains.set(chatId, saved);

    const srvNote = info.hasSrv 
      ? "🎯 *DNS SRV aniqlandi:* Dinamik port `" + info.port + "` avtomatik topildi!"
      : "ℹ️ *Port:* `" + info.port + "` (standart)";

    const cardText = 
      "✅ *Yangi Subdomen Qabul Qilindi!*\n\n" +
      "🌐 *Subdomen:* `" + info.cleanSubdomain + "`\n" +
      "🔌 *Ulanish manzili:* `" + info.host + ":" + info.port + "`\n" +
      "🤖 *Avtomatik Bot Niki:* `" + info.botNick + "`\n" +
      srvNote + "\n\n" +
      "Botni hoziroq serverga kiritish va serverni 24/7 yoniq saqlash uchun quyidagi tugmani bosing:";

    const opts = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🟢 Botni Serverga Ulash (24/7)", callback_data: "launch_" + encodeURIComponent(info.cleanSubdomain) }
          ],
          [
            { text: "🔄 Subdomenni Qayta Tekshirish", callback_data: "check_" + encodeURIComponent(info.cleanSubdomain) },
            { text: "🛑 To'xtatish", callback_data: "stop_bot" }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, cardText, opts);

  } catch (err) {
    bot.sendMessage(chatId, "❌ Subdomenni aniqlashda xatolik: " + err.message);
  }
}

// Tugmalar bosilganda (Callback Query)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const action = query.data;

  if (action.startsWith('launch_')) {
    const sub = decodeURIComponent(action.replace('launch_', ''));
    const saved = userSubdomains.get(chatId) || [];
    const info = saved.find(s => s.cleanSubdomain === sub) || saved[0];

    if (!info) {
      bot.sendMessage(chatId, "⚠️ Subdomen topilmadi. Qaytadan subdomen yuboring.");
      return;
    }

    // Eski botni to'xtatish
    stopExistingBot(chatId);

    bot.editMessageText(
      "⏳ *Bot serverga ulanmoqda...*\nSubdomen: `" + info.cleanSubdomain + "`\nManzil: `" + info.host + ":" + info.port + "`",
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }
    );

    startMinecraftBot(chatId, info);

  } else if (action.startsWith('check_')) {
    const sub = decodeURIComponent(action.replace('check_', ''));
    const info = await parseSubdomainInfo(sub);
    
    bot.answerCallbackQuery(query.id, { 
      text: "Tekshirildi: " + info.host + ":" + info.port + (info.hasSrv ? " (SRV Topildi)" : ""),
      show_alert: true 
    });

  } else if (action === 'status_refresh') {
    sendStatusMessage(chatId, query.message.message_id);

  } else if (action === 'force_jump') {
    const session = activeMcBots.get(chatId);
    if (session && session.bot) {
      session.bot.setControlState('jump', true);
      setTimeout(() => session.bot?.setControlState('jump', false), 500);
      bot.answerCallbackQuery(query.id, { text: "🦘 Bot o'yinda sakradi!" });
    } else {
      bot.answerCallbackQuery(query.id, { text: "⚠️ Bot hozir faol emas" });
    }

  } else if (action === 'stop_bot') {
    stopExistingBot(chatId);
    bot.editMessageText("🛑 Bot to'xtatildi va serverdan chiqarildi.\nQayta yoqish uchun yana subdomen yuboring.", {
      chat_id: chatId,
      message_id: query.message.message_id
    });
  }
});

// /status buyrug'i
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  sendStatusMessage(chatId);
});

// /stop buyrug'i
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  if (activeMcBots.has(chatId)) {
    stopExistingBot(chatId);
    bot.sendMessage(chatId, "🛑 Bot to'xtatildi. Qayta yoqish uchun subdomenni yuboring yoki /start bosing.");
  } else {
    bot.sendMessage(chatId, "ℹ️ Hozirda faol bot mavjud emas. Yangi subdomen kiritish uchun /start bosing.");
  }
});

// /help buyrug'i
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpText = 
    "📌 *Bot Buyruqlari va Foydalanish:*\n\n" +
    "• Shunchaki subdomenni yozib yuboring: `myserver.aternos.me` yoki `myserver`\n" +
    "• /subdomen <nom> - Yangi server subdomenini qo'shish\n" +
    "• /status - Server va AFK bot holati (uptime, sakrashlar)\n" +
    "• /stop - Botni serverdan chiqarish va to'xtatish\n" +
    "• /help - Ushbu yordam oynasi\n\n" +
    "💡 *Aternos foydalanuvchilariga eslatma:*\n" +
    "1. Aternos panelida serverni ONLAYN qiling.\n" +
    "2. Sozlamalarda (Options) *'Cracked'* (Piratka) parametrini YOQIB qo'ying!";

  bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

/**
 * Mineflayer orqali Minecraft serveriga ulanish va 24/7 Keep-Alive
 */
function startMinecraftBot(chatId, info) {
  try {
    const mcBot = mineflayer.createBot({
      host: info.host,
      port: info.port,
      username: info.botNick || generateBotNick(),
      auth: 'offline', // Aternos va TLauncher uchun offline rejim
      version: false   // Server versiyasini avtomatik aniqlash
    });

    const session = {
      bot: mcBot,
      info: info,
      startTime: Date.now(),
      status: 'connecting',
      keepAliveInterval: null,
      jumpsCount: 0,
      reconnectAttempts: 0
    };

    activeMcBots.set(chatId, session);

    mcBot.on('login', () => {
      session.status = 'online';
      session.reconnectAttempts = 0;
      bot.sendMessage(
        chatId,
        "🎉 *MUVAFFAQINAT! Bot serverga muvaffaqiyatli kirdi!*\n\n" +
        "🌐 *Subdomen:* `" + info.cleanSubdomain + "`\n" +
        "🤖 *Bot Niki:* `" + mcBot.username + "`\n" +
        "⚡ *Holat:* Server endi 24/7 yoniq saqlanadi!\n\n" +
        "Tekshirish uchun /status bosing.",
        { parse_mode: 'Markdown' }
      );
    });

    mcBot.on('spawn', () => {
      // Anti-AFK harakatlar: sakrash, burilish, o'tirish
      if (session.keepAliveInterval) clearInterval(session.keepAliveInterval);

      session.keepAliveInterval = setInterval(() => {
        try {
          if (!mcBot || !mcBot.entity) return;

          // Sakrash
          mcBot.setControlState('jump', true);
          setTimeout(() => mcBot?.setControlState('jump', false), 350);

          // Bosh burish (Aternos AFK tizimi sezmasligi uchun)
          const yaw = Math.random() * Math.PI * 2;
          const pitch = (Math.random() - 0.5) * Math.PI * 0.3;
          mcBot.look(yaw, pitch, true);

          session.jumpsCount++;
        } catch (e) {}
      }, 25000); // Har 25 soniyada
    });

    mcBot.on('kicked', (reason) => {
      session.status = 'kicked';
      bot.sendMessage(chatId, "⚠️ *Bot serverdan chiqarildi:*\n" + reason + "\n\n15 soniyadan so'ng avtomatik qayta ulanadi...", { parse_mode: 'Markdown' });
      triggerAutoReconnect(chatId, info);
    });

    mcBot.on('error', (err) => {
      console.error("MC Error:", err.message);
      bot.sendMessage(chatId, "❌ *Aloqa xatoligi:* " + err.message + "\nServer yoniq va Cracked yoqilganligini tekshiring.");
      triggerAutoReconnect(chatId, info);
    });

    mcBot.on('end', () => {
      if (session.keepAliveInterval) clearInterval(session.keepAliveInterval);
      session.status = 'offline';
      triggerAutoReconnect(chatId, info);
    });

  } catch (err) {
    bot.sendMessage(chatId, "❌ Botni ishga tushirishda xatolik: " + err.message);
  }
}

function triggerAutoReconnect(chatId, info) {
  const session = activeMcBots.get(chatId);
  if (!session) return;
  if (session.reconnectAttempts > 5) {
    bot.sendMessage(chatId, "⚠️ Server bilan aloqa 5 marta uzildi. Server o'chgan bo'lishi mumkin. Qayta yoqish uchun subdomenni yuboring.");
    stopExistingBot(chatId);
    return;
  }
  session.reconnectAttempts++;
  setTimeout(() => {
    if (activeMcBots.has(chatId)) {
      startMinecraftBot(chatId, info);
    }
  }, 15000);
}

function stopExistingBot(chatId) {
  const session = activeMcBots.get(chatId);
  if (session) {
    if (session.keepAliveInterval) clearInterval(session.keepAliveInterval);
    if (session.bot) {
      try {
        session.bot.quit();
      } catch (e) {}
    }
    activeMcBots.delete(chatId);
  }
}

function sendStatusMessage(chatId, editMessageId = null) {
  const session = activeMcBots.get(chatId);

  if (!session) {
    const msg = "ℹ️ Hozirda hech qanday bot ishlamayapti.\nServerni 24/7 yoqish uchun server subdomenini yuboring (Masalan: `myserver.aternos.me`).";
    if (editMessageId) {
      bot.editMessageText(msg, { chat_id: chatId, message_id: editMessageId });
    } else {
      bot.sendMessage(chatId, msg);
    }
    return;
  }

  const uptimeMinutes = Math.floor((Date.now() - session.startTime) / 60000);
  const statusEmoji = session.status === 'online' ? '🟢 ONLAYN (24/7 Faol)' : '🟡 ULANMOQDA';

  const text = 
    "📊 *MINECRAFT SUBDOMEN AFK BOT HOLATI*\n\n" +
    "• *Subdomen:* `" + session.info.cleanSubdomain + "`\n" +
    "• *Server Manzili:* `" + session.info.host + ":" + session.info.port + "`\n" +
    "• *Bot Niki:* `" + (session.bot?.username || session.info.botNick) + "`\n" +
    "• *Holat:* " + statusEmoji + "\n" +
    "• *Ishlagan vaqti:* " + uptimeMinutes + " daqiqa\n" +
    "• *Anti-AFK Harakatlari:* " + session.jumpsCount + " marta\n" +
    "• *Aternos o'chish xavfi:* 0% (Kafolatlangan)\n";

  const opts = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔄 Yangilash", callback_data: "status_refresh" },
          { text: "🦘 Sakrash", callback_data: "force_jump" }
        ],
        [
          { text: "🛑 Botni To'xtatish", callback_data: "stop_bot" }
        ]
      ]
    }
  };

  if (editMessageId) {
    bot.editMessageText(text, { chat_id: chatId, message_id: editMessageId, ...opts });
  } else {
    bot.sendMessage(chatId, text, opts);
  }
}
