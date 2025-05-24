const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
 'https://dgjthawzhygycyyfbvdh.supabase.co',
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnanRoYXd6aHlneWN5eWZidmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTQ4NzUsImV4cCI6MjA2MjM3MDg3NX0._9-RtrQNoowkXKscujLv3BtEsc82hfoJQy2BuVt2DR8'
);

const BOT_TOKEN = process.env.BOT_TOKEN;

exports.handler = async (event, context) => {
 try {
   const update = JSON.parse(event.body);
   
   // ОТЛАДКА - что получаем
   console.log('Received update:', JSON.stringify(update, null, 2));
   console.log('BOT_TOKEN exists:', !!BOT_TOKEN);
   
   if (update.message) {
     console.log('Message text received:', update.message.text);
     console.log('Message type:', typeof update.message.text);
   }
   
   // Если пользователь написал /start (расширенное условие)
   if (update.message && (update.message.text === '/start' || update.message.text?.startsWith('/start'))) {
     const user = update.message.from;
     const chatId = update.message.chat.id;
     
     console.log('Processing start command for user:', user.id);
     
     // Сохраняем пользователя в базу
     const { data, error } = await supabase
       .from('userID')
       .upsert({
         telegram_user_id: user.id,
         username: user.username || null,
         first_name: user.first_name || null
       });
     
     if (error) {
       console.log('Error saving user:', error);
     } else {
       console.log('User saved:', user.id);
     }
     
     // Создаем персональную ссылку
     const personalUrl = `https://coffee-shop-app-um48rx.flutterflow.app/?user_id=${user.id}`;
     console.log('Generated URL:', personalUrl);
     
     // Отправляем сообщение с inline кнопкой
     const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         chat_id: chatId,
         text: 'Добро пожаловать в наш кофе-шоп! ☕',
         reply_markup: {
           inline_keyboard: [[
             { text: '🛍️ Открыть магазин', web_app: { url: personalUrl } }
           ]]
         }
       })
     });
     
     const responseData = await telegramResponse.json();
     console.log('Telegram API response:', responseData);
     console.log('Message sent to user:', user.id);
   }
   
   return {
     statusCode: 200,
     body: JSON.stringify({ ok: true })
   };
 } catch (error) {
   console.log('Bot error:', error);
   return {
     statusCode: 500,
     body: JSON.stringify({ error: error.message })
   };
 }
};
