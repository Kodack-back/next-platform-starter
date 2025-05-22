const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgjthawzhygycyyfbvdh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnanRoYXd6aHlneWN5eWZidmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTQ4NzUsImV4cCI6MjA2MjM3MDg3NX0._9-RtrQNoowkXKscujLv3BtEsc82hfoJQy2BuVt2DR8'
);

exports.handler = async function(event, context) {
  console.log('Function started');
  
  try {
    console.log('Getting Cart data...');
    
    const { data: cartData, error: cartError } = await supabase
      .from('Cart')
      .select('*');

    if (cartError) {
      console.log('Cart error:', cartError);
      throw new Error('Cart error: ' + cartError.message);
    }
    
    console.log('Cart data:', cartData);

    console.log('Getting Order data...');
    const { data: orderData, error: orderError } = await supabase
      .from('user_coment')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (orderError) {
      console.log('Order error:', orderError);
      throw new Error('Order error: ' + orderError.message);
    }
    
    console.log('Order data:', orderData);

    const order = orderData[0];

    // Простое сообщение без total
    let cartMessage = "🛒 *Новый заказ!*\n\n";
    cartMessage += "*Товары:*\n";

    cartData.forEach(item => {
      cartMessage += `• ${item.name} - ${item.price_variant}฿\n`;
    });

    let orderMessage = "📋 *Данные заказа:*\n\n";
    orderMessage += `*Адрес доставки:* ${order?.delivery_address || 'Не указан'}\n`;
    orderMessage += `*Контакт:* ${order?.contact_info || 'Не указан'}\n`;
    orderMessage += `*Комментарий:* ${order?.comments || 'Нет'}`;

    const botToken = "7858661869:AAHWjpimjO8BheoOZjnjT9l6R6hKVqUvhPE";
    const chatId = "7757484948";

    console.log('Sending to Telegram...');

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: cartMessage,
        parse_mode: "Markdown"
      })
    });

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: orderMessage,
        parse_mode: "Markdown"
      })
    });

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
