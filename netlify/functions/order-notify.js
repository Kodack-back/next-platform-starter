const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
 'https://dgjthawzhygycyyfbvdh.supabase.co',
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnanRoYXd6aHlneWN5eWZidmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTQ4NzUsImV4cCI6MjA2MjM3MDg3NX0._9-RtrQNoowkXKscujLv3BtEsc82hfoJQy2BuVt2DR8'
);

exports.handler = async function(event, context) {
 console.log('Function started');
 
 try {
   // Безопасное получение telegram_user_id
   const body = event.body ? JSON.parse(event.body) : {};
   const telegram_user_id = body.telegram_user_id || 'test_user_123';
   console.log('User ID:', telegram_user_id);
   
   console.log('Getting Cart data...');
   
   const { data: cartData, error: cartError } = await supabase
     .from('Cart')
     .select('*')
     .eq('telegram_user_id', telegram_user_id);
   
   if (cartError) {
     console.log('Cart error:', cartError);
     throw new Error('Cart error: ' + cartError.message);
   }
   
   console.log('Cart data:', cartData);
   console.log('Getting Order data...');
   
   const { data: orderData, error: orderError } = await supabase
     .from('user_coment')
     .select('*')
     .eq('telegram_user_id', telegram_user_id)
     .order('created_at', { ascending: false })
     .limit(1);
   
   if (orderError) {
     console.log('Order error:', orderError);
     throw new Error('Order error: ' + orderError.message);
   }
   
   console.log('Order data:', orderData);
   const order = orderData[0];
   
   let cartMessage = "🛒 *Новый заказ!*\n\n";
   cartMessage += `*Пользователь:* ${telegram_user_id}\n`;
   cartMessage += "*Товары:*\n";
   
   // Улучшенная обработка корзины
   if (cartData && cartData.length > 0) {
     cartData.forEach(item => {
       cartMessage += `• ${item.name || 'Товар'} - ${item.price_variant || '0'}฿\n`;
     });
   } else {
     cartMessage += "Корзина пуста\n";
   }
   
   let orderMessage = "📋 *Данные заказа:*\n\n";
   
   // Улучшенная обработка NULL значений
   if (order) {
     orderMessage += `*Адрес доставки:* ${order.delivery_address || 'Не указан'}\n`;
     orderMessage += `*Контакт:* ${order.contact_info || 'Не указан'}\n`;
     orderMessage += `*Комментарий:* ${order.comments || 'Без комментариев'}`;
   } else {
     orderMessage += "*Данные заказа не найдены*";
   }
   
   const botToken = process.env.BOT_TOKEN;
   const chatId = "7121076642";
   
   console.log('Sending to Telegram...');
   
   // Отправляем первое сообщение
   const firstResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       chat_id: chatId,
       text: cartMessage,
       parse_mode: "Markdown"
     })
   });
   
   if (!firstResponse.ok) {
     const errorText = await firstResponse.text();
     console.log('First message error:', errorText);
   }
   
   // Отправляем второе сообщение
   const secondResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       chat_id: chatId,
       text: orderMessage,
       parse_mode: "Markdown"
     })
   });
   
   if (!secondResponse.ok) {
     const errorText = await secondResponse.text();
     console.log('Second message error:', errorText);
   }
   
   console.log('Messages sent successfully');
   
   return {
     statusCode: 200,
     body: JSON.stringify({ success: true, message: "Order sent!" })
   };
 } catch (error) {
   console.log('Error:', error.message);
   return {
     statusCode: 500,
     body: JSON.stringify({ error: error.message })
   };
 }
};
