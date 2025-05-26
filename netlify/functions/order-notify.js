// Используем прямые HTTP запросы к Supabase REST API вместо клиента
exports.handler = async (event, context) => {
  // CORS headers
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

  const supabaseUrl = 'https://dgjthawzhygycyyfbvdh.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnanRoYXd6aHlneWN5eWZidmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTQ4NzUsImV4cCI6MjA2MjM3MDg3NX0._9-RtrQNoowkXKscujLv3BtEsc82hfoJQy2BuVt2DR8';

  try {
    // Получаем данные корзины через REST API
    console.log('Getting Cart data...');
    const cartResponse = await fetch(`${supabaseUrl}/rest/v1/Cart?telegram_user_id=eq.${telegram_user_id}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!cartResponse.ok) {
      console.error('Cart fetch failed:', cartResponse.status, cartResponse.statusText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `Cart fetch failed: ${cartResponse.statusText}` }),
      };
    }

    const cartData = await cartResponse.json();
    console.log('Cart data:', cartData);

    // Получаем данные заказа через REST API
    console.log('Getting Order data...');
    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/user_coment?telegram_user_id=eq.${telegram_user_id}&order=created_at.desc&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!orderResponse.ok) {
      console.error('Order fetch failed:', orderResponse.status, orderResponse.statusText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `Order fetch failed: ${orderResponse.statusText}` }),
      };
    }

    const orderData = await orderResponse.json();
    console.log('Order data:', orderData);

    // Отправляем в Telegram
    console.log('Sending to Telegram...');
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = telegram_user_id.replace(/^tg_/, '').split('_')[0];

    let orderMessage = '🛒 Новый заказ!\n\n';
    
    // Добавляем товары
    if (cartData && cartData.length > 0) {
      orderMessage += 'Товары:\n';
      let totalPrice = 0;
      
      cartData.forEach(item => {
        orderMessage += `• ${item.name || 'Неизвестный товар'} - ${item.price_variant || 0}B (${item.quantity || 1}x)\n`;
        totalPrice += (item.price_variant || 0) * (item.quantity || 1);
      });
      
      orderMessage += `\nОбщая сумма: ${totalPrice}B\n\n`;
    } else {
      orderMessage += 'Товары: Корзина пуста\n\n';
    }

    // Добавляем детали заказа
    const order = orderData && orderData.length > 0 ? orderData[0] : null;
    orderMessage += `Адрес доставки: ${order?.delivery_address || 'Не указан'}\n`;
    orderMessage += `Контакт: ${order?.contact_info || 'Не указан'}\n`;
    orderMessage += `Комментарий: ${order?.comments || 'Без комментариев'}\n`;
    orderMessage += `ID пользователя: ${telegram_user_id}`;

    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: orderMessage,
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
