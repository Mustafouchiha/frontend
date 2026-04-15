// ReQurilish Telegram Bot - Telegraf
const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-app.vercel.app';
const JWT_SECRET = process.env.JWT_SECRET || 'remarket-demo-secret-2024';

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Database helpers
const DB_FILE = path.join(__dirname, 'db.json');
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { users: [], products: [], offers: [], payments: [] };
  }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// JWT helpers
const jwt = require('jsonwebtoken');
const createToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

// Phone number handler
bot.on('contact', async (ctx) => {
  await handlePhoneNumber(ctx, ctx.message.contact.phone_number, ctx.message.contact.user_id);
});

// Text handler for phone numbers
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  
  // Check if it's a phone number
  const phoneRegex = /^\+998\d{9}$/;
  if (phoneRegex.test(text.replace(/\s/g, ''))) {
    const phone = text.replace(/\s/g, '');
    await handlePhoneNumber(ctx, phone, ctx.from.id);
    return;
  }
  
  // Handle other commands
  if (text === '/start') {
    await handleStart(ctx);
  }
});

async function handlePhoneNumber(ctx, phone, telegramId) {
  const db = readDB();
  
  // Find or create user
  let user = db.users.find(u => u.phone === phone);
  if (!user) {
    user = {
      id: require('crypto').randomUUID(),
      name: ctx.from.first_name || 'Foydalanuvchi',
      phone,
      telegram: `@${ctx.from.username || 'user'}`,
      tg_chat_id: ctx.chat.id,
      avatar: null,
      balance: 0,
      joined: new Date().toISOString(),
    };
    db.users.push(user);
  } else {
    // Update existing user
    user.tg_chat_id = ctx.chat.id;
    user.telegram = `@${ctx.from.username || 'user'}`;
  }
  
  saveDB(db);
  
  // Generate token and send login button
  const token = createToken(user.id);
  
  await ctx.reply(`Xush kelibsiz, ${user.name}! ✅`, {
    reply_markup: {
      inline_keyboard: [[
        {
          text: "🚀 ReQurilish — kirish",
          web_app: { url: `${MINI_APP_URL}?token=${token}` }
        }
      ]]
    }
  });
}

async function handleStart(ctx) {
  await ctx.reply('ReQurilish botiga xush kelibsiz! 🏗️\n\n' +
    'Telefon raqamingizni yuboring yoki +998901234567 formatida kiriting:', {
      reply_markup: {
        keyboard: [[
          { text: '📞 Telefon raqamni yuborish', request_contact: true }
        ]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
}

// Operator approval actions
bot.action(/approve_(.+)/, async (ctx) => {
  const productId = ctx.match[1];
  const db = readDB();
  
  const product = db.products?.find(p => p.id === productId);
  if (!product) {
    await ctx.answerCbQuery('Mahsulot topilmadi ❌');
    return;
  }
  
  // Update product status
  product.status = 'approved';
  product.updated_at = new Date().toISOString();
  saveDB(db);
  
  // Notify user
  const user = db.users?.find(u => u.id === product.owner_id);
  if (user && user.tg_chat_id) {
    await ctx.telegram.sendMessage(user.tg_chat_id, 
      `✅ Postingiz tasdiqlandi va e'lon qilindi!\n\n` +
      `📦 Mahsulot: ${product.name}\n` +
      `💰 Narx: ${product.price} so'm\n\n` +
      `Endi barcha foydalanuvchilarga ko'rinadi!`
    );
  }
  
  await ctx.answerCbQuery('Post tasdiqlandi ✅');
  await ctx.editMessageText(`✅ Mahsulot tasdiqlandi:\n\n${product.name}\n💰 ${product.price} so'm`);
});

bot.action(/reject_(.+)/, async (ctx) => {
  const productId = ctx.match[1];
  const db = readDB();
  
  const product = db.products?.find(p => p.id === productId);
  if (!product) {
    await ctx.answerCbQuery('Mahsulot topilmadi ❌');
    return;
  }
  
  // Update product status
  product.status = 'rejected';
  product.updated_at = new Date().toISOString();
  saveDB(db);
  
  // Notify user
  const user = db.users?.find(u => u.id === product.owner_id);
  if (user && user.tg_chat_id) {
    await ctx.telegram.sendMessage(user.tg_chat_id, 
      `❌ Postingiz rad etildi\n\n` +
      `📦 Mahsulot: ${product.name}\n` +
      `💰 Narx: ${product.price} so'm\n\n` +
      `Sabab: Operator tomonidan rad etilgan`
    );
  }
  
  await ctx.answerCbQuery('Post rad etildi ❌');
  await ctx.editMessageText(`❌ Mahsulot rad etildi:\n\n${product.name}\n💰 ${product.price} so'm`);
});

// New post notification to operators
async function notifyOperators(product) {
  const db = readDB();
  const operators = db.users?.filter(u => u.is_operator) || [];
  
  if (operators.length === 0) {
    // Fallback to admin
    console.log('🆕 Yangi post tekshiruvda:', product.name);
    return;
  }
  
  const message = `🆕 Yangi post tekshiruvda!\n\n` +
    `📦 Nomi: ${product.name}\n` +
    `💰 Narxi: ${product.price} so'm\n` +
    `📊 Miqdori: ${product.qty} ${product.unit}\n` +
    `📍 Joylashuv: ${product.viloyat}${product.tuman ? ', ' + product.tuman : ''}${product.mahalla ? ', ' + product.mahalla : ''}\n` +
    `👤 Egasi: ${product.owner_name || 'Noma\'lum'}\n` +
    `📞 Telefon: ${product.owner_phone || 'Noma\'lum'}`;
  
  for (const operator of operators) {
    try {
      await bot.telegram.sendMessage(operator.tg_chat_id, message, {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '✅ Tasdiqlash',
              callback_data: `approve_${product.id}`
            },
            {
              text: '❌ Rad etish',
              callback_data: `reject_${product.id}`
            }
          ]]
        }
      });
    } catch (error) {
      console.error('Error notifying operator:', error);
    }
  }
}

// Export functions for use in server.js
module.exports = {
  bot,
  notifyOperators,
  createToken,
  handlePhoneNumber
};

// Start bot
bot.launch().then(() => {
  console.log('🤖 ReQurilish bot ishga tushdi!');
}).catch(err => {
  console.error('Bot launch error:', err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
