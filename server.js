const puppeteer = require('puppeteer');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const ROBLOX_USER = 'BOT_ROXI7';
const ROBLOX_PASS = 'aziz@115';
const BOT_TOKEN = '8751353960:AAGT-vRyzgzUPH-P3jUUfnKPS9rkLT8l_6w';
const CHAT_ID = '7783051926';

const bot = new TelegramBot(BOT_TOKEN, { polling: false });
let previousStatus = { isOnline: false, placeId: null };
let robloxCookie = null;

async function getRobloxCookie() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.goto('https://www.roblox.com/login', { waitUntil: 'networkidle2' });
        
        // إدخال اسم المستخدم
        await page.type('#login-username', ROBLOX_USER);
        // إدخال كلمة المرور
        await page.type('#login-password', ROBLOX_PASS);
        // الضغط على زر تسجيل الدخول
        await page.click('#login-button');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        
        // استخراج الكوكي
        const cookies = await page.cookies();
        const securityCookie = cookies.find(c => c.name === '.ROBLOSECURITY');
        if (!securityCookie) throw new Error('كوكي الأمان غير موجود');
        robloxCookie = securityCookie.value;
        await bot.sendMessage(CHAT_ID, '✅ تم استخراج الكوكي بنجاح');
        return robloxCookie;
    } catch (e) {
        throw new Error(`فشل استخراج الكوكي: ${e.message}`);
    } finally {
        await browser.close();
    }
}

async function checkRoblox() {
    try {
        if (!robloxCookie) throw new Error('لم يتم تسجيل الدخول بعد');
        // استخدام الكوكي للتحقق من الحضور عبر API
        const response = await axios.get('https://presence.roblox.com/v1/presence/users', {
            headers: { 'Cookie': `.ROBLOSECURITY=${robloxCookie}` }
        });
        // باقي الكود مشابه للسابق...
        await bot.sendMessage(CHAT_ID, '✅ تم التحقق من الحضور');
    } catch (e) {
        console.error('خطأ:', e.message);
        await bot.sendMessage(CHAT_ID, `⚠️ خطأ: ${e.message}`);
    }
}

async function start() {
    await bot.sendMessage(CHAT_ID, '🤖 جاري تشغيل المتصفح الافتراضي...');
    try {
        await getRobloxCookie();
        await bot.sendMessage(CHAT_ID, '✅ تم تسجيل الدخول بنجاح. بدء المراقبة.');
        await checkRoblox();
        setInterval(checkRoblox, 60000);
    } catch (e) {
        await bot.sendMessage(CHAT_ID, `❌ فشل تسجيل الدخول: ${e.message}`);
        console.error(e);
    }
}
start();
