const noblox = require('noblox.js');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const ROBLOX_USER = 'BOT_ROXI7';
const ROBLOX_PASS = 'aziz@115';
const BOT_TOKEN = '8751353960:AAGT-vRyzgzUPH-P3jUUfnKPS9rkLT8l_6w';
const CHAT_ID = '7783051926';

const bot = new TelegramBot(BOT_TOKEN, { polling: false });
let previousStatus = { isOnline: false, placeId: null };
let robloxCookie = null;

async function getGameName(placeId) {
    try {
        const res = await axios.get(`https://games.roblox.com/v1/games?universeIds=${placeId}`);
        return res.data.data[0]?.name || 'لعبة غير معروفة';
    } catch { return 'غير متاح'; }
}

async function loginRoblox() {
    try {
        // محاولة تسجيل الدخول باستخدام اسم المستخدم وكلمة المرور
        const response = await axios.post('https://auth.roblox.com/v2/login', {
            ctype: 'Username',
            cvalue: ROBLOX_USER,
            password: ROBLOX_PASS
        });
        // استخراج الكوكي من رؤوس الاستجابة
        const setCookieHeader = response.headers['set-cookie'];
        if (!setCookieHeader) throw new Error('لم يتم استلام كوكي');
        robloxCookie = setCookieHeader.find(c => c.startsWith('.ROBLOSECURITY='));
        if (!robloxCookie) throw new Error('كوكي الأمان غير موجود');
        // تنظيف الكوكي
        robloxCookie = robloxCookie.split(';')[0];
        await noblox.setCookie(robloxCookie);
        return true;
    } catch (e) {
        throw new Error(`فشل تسجيل الدخول: ${e.message}`);
    }
}

async function checkRoblox() {
    try {
        if (!robloxCookie) throw new Error('لم يتم تسجيل الدخول بعد');
        const currentUser = await noblox.setCookie(robloxCookie);
        const presence = await noblox.getPresence({ userIds: [currentUser.UserID] });
        const p = presence.userPresences[0];
        const isOnline = (p.userPresenceType === 'Online' || p.userPresenceType === 'InGame');
        const placeId = p.placeId || null;
        let gameName = '', gameUrl = '';
        if (placeId) {
            gameName = await getGameName(placeId);
            gameUrl = `https://www.roblox.com/games/${placeId}`;
        }
        if ((isOnline !== previousStatus.isOnline || placeId !== previousStatus.placeId) && isOnline) {
            await bot.sendMessage(CHAT_ID, `🔔 دخل ${ROBLOX_USER} إلى:\n🎮 ${gameName}\n🔗 ${gameUrl}\n🕒 ${new Date().toLocaleString('ar-EG')}`);
            previousStatus = { isOnline, placeId };
        } else if (!isOnline && previousStatus.isOnline) {
            await bot.sendMessage(CHAT_ID, `🔴 خرج ${ROBLOX_USER} من اللعبة.`);
            previousStatus = { isOnline, placeId: null };
        }
    } catch (e) {
        console.error('خطأ:', e.message);
        await bot.sendMessage(CHAT_ID, `⚠️ خطأ: ${e.message}`);
    }
}

async function start() {
    await bot.sendMessage(CHAT_ID, '🤖 جاري تسجيل الدخول إلى Roblox...');
    try {
        await loginRoblox();
        await bot.sendMessage(CHAT_ID, '✅ تم تسجيل الدخول بنجاح. بدء المراقبة.');
        await checkRoblox();
        setInterval(checkRoblox, 30000);
    } catch (e) {
        await bot.sendMessage(CHAT_ID, `❌ فشل تسجيل الدخول: ${e.message}`);
        console.error(e);
    }
}
start();
