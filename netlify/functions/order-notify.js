const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygmhyinqwgkjkhixisrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbWh5aW5xd2dramtoaXhpc3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ4MTA2MzAsImV4cCI6MjAzMDM4NjYzMH0.LOy5s4mLU3xf5jK2sBfhm6Fk3r8CaO8BPhcHCy9k9aY';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // ДОБАВЛЯЕМ CORS HEADERS!
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Обрабатываем OPTIONS запрос (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  console.log('Function started');
  
  const body = event.body ? JSON.parse(event.body) : {};
  const telegram_user_id = body.telegram_user_id || 'test_user_123';
  
  console.log('User ID:', telegram_user_id);

  try {
    // Получаем данные корзины
    console.log('Getting Cart data...');
    const { data: cartData, error: cartError } = await supabase
      .from('Cart')
      .select('*')
      .eq('telegram_user_id', telegram_user_id);

    if (cartError) {
      console.error('Cart Error:', cartError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: cartError.message }),
      };
    }

    console.log('Cart data:', cartData);

    // Получаем данные заказа
    console.log('Getting Order data...');
    const { data: orderData, error: orderError } = await supabase
      .from('user_coment')
      .select('*')
      .eq('telegram_user_id', telegram_user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (orderError) {
      console.error('Order Error:', orderError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: orderError.message }),
      };
    }

    console.log('Order data:', orderData);

    // Отправляем в Telegram
    console.log('Sending to Telegram...');
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = telegram_user_id.replace(/^tg_/, '').split('_')[0];

    let orderMessage = '*🛒 Новый заказ!*\n\n';
    
    // Добавляем товары
    if (cartData && cartData.length > 0) {
      orderMessage += '*Товары:*\n';
      let totalPrice = 0;
      
      cartData.forEach(item => {
        orderMessage += `• ${item.name || 'Неизвестный товар'} - ${item.price_variant || 0}B (${item.quantity || 1}x)\n`;
        totalPrice += (item.price_variant || 0) * (item.quantity || 1);
      });
      
      orderMessage += `\n*Общая сумма:* ${totalPrice}B\n\n`;
    } else {
      orderMessage += '*Товары:* Корзина пуста\n\n';
    }

    // Добавляем детали заказа
    const order = orderData && orderData.length > 0 ? orderData[0] : null;
    orderMessage += `*Адрес доставки:* ${order?.delivery_address || 'Не указан'}\n`;
    orderMessage += `*Контакт:* ${order?.contact_info || 'Не указан'}\n`;
    orderMessage += `*Комментарий:* ${order?.comments || 'Без комментариев'}\n`;
    orderMessage += `*ID пользователя:* ${telegram_user_id}`;

    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: orderMessage,
        parse_mode: 'Markdown',
      }),
    });

    if (telegramResponse.ok) {
      console.log('Messages sent successfully');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Order notification sent' }),
      };
    } else {
      const errorText = await telegramResponse.text();
      console.error('Telegram API Error:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to send Telegram message' }),
      };
    }

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
