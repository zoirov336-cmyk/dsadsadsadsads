# 🤖 Telegram Minecraft 24/7 Subdomen AFK Keeper Bot

Faqat server **subdomenini** (masalan: `myserver.aternos.me` yoki `myserver`) yuborish orqali Minecraft serveringizni (Aternos, FalixNodes, VPS) 24/7 o'chmaydigan qilib ushlab turuvchi tayyor Telegram Bot!

## ⚡ Qanday qulayliklari bor?
1. **Faqat Subdomen Kiritish Kifoya:** Port yoki boshqa murakkab sozlamalarni kiritish shart emas. Bot DNS SRV orqali dinamik portni avtomatik topadi.
2. **Qisqa nom kiritish:** Agar `myserver` deb yozilsa, bot o'zi `myserver.aternos.me` qilib to'ldiradi.
3. **Avtomatik Anti-AFK:** Har 25 soniyada sakrab, bosh buradi — Aternos yoki server anti-afk plaginlari uni hech qachon serverdan haydamaydi.
4. **Avtomatik Qayta Ulanish (Auto-Reconnect):** Agar server restart bersa, bot 15 soniyada o'zi qaytadan kiradi.

---

## 🚀 1-BOSQICH: Telegram Bot Token Olish
1. Telegram ilovasida [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/newbot` buyrug'ini yuboring.
3. Botingizga nom va username tanlang (masalan: `MySubdomainKeeperBot`).
4. BotFather sizga **HTTP API TOKEN** beradi (masalan: `7123456789:AAH...`). Uni nusxalab oling!

---

## 🐙 2-BOSQICH: GitHub ga Joylash
1. [GitHub.com](https://github.com) ga kiring va yangi repository oching (masalan `mc-subdomain-bot`).
2. Yuklab olingan ZIP ichidagi barcha fayllarni (`index.js`, `package.json`, `railway.json`, `Procfile`, `.gitignore`) GitHub repositoryingizga yuklang (Upload files).

---

## 🚂 3-BOSQICH: Railway.app da 24/7 Bepul Yoqish
1. [Railway.app](https://railway.app) ga kiring (GitHub orqali ro'yxatdan o'ting).
2. **«+ New Project»** tugmasini bosing.
3. **«Deploy from GitHub repo»** ni tanlang va GitHub repositoryingizni tanlang.
4. Loyiha sozlamalarida **«Variables» (O'zgaruvchilar)** bo'limiga kiring va quyidagini qo'shing:
   - **Key:** `BOT_TOKEN`
   - **Value:** `BotFather bergan tokeningiz`
5. **«Deploy»** tugmasini bosing! 
6. Tayyor! Endi Telegram botingiz 24 soat tinimsiz ishlaydi va kompyuteringiz o'chiq bo'lsa ham serveringizni ushlab turadi!

---

## 💬 Telegram Buyruqlari:
- Shunchaki subdomenni yuboring: `myserver.aternos.me` yoki `myserver`
- `/subdomen <subdomen>` - Yangi subdomen qo'shish
- `/status` - Server holati, uptime va statistika
- `/stop` - Botni to'xtatish
- `/help` - Yordam
