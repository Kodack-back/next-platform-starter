// netlify/functions/send-order.js
exports.handler = async function(event, context) {
  try {
    // Проверка метода
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    
    // Парсинг тела запроса
    const data = JSON.parse(event.body);
    const { items, totalPrice, comment, contact } = data;
    
    // Форматирование сообщения
    let message = "🛒 *Новый заказ!*\n\n";
    message += "*Товары:*\n";
    
    items.forEach(item => {
      message += `• ${item.name} - ${item.quantity} x ${item.price}฿ = ${item.quantity * item.price}฿\n`;
    });
    
    message += `\n*Общая сумма:* ${totalPrice}฿\n`;
    message += `\n*Комментарий:* ${comment || "Нет"}\n`;
    message += `\n*Контакт:* ${contact || "Не указан"}\n`;
    
    // Отправка в Telegram
    const botToken = "7858661869:AAHWjpimjO8BheoOZjnjT9l6R6hKVqUvhPE"; // Замените на свой токен
    const chatId = "https://t.me/Dofomine_MNG"; // Замените на свой chat_id
    
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown"
        })
      }
    );
    
    const telegramData = await telegramResponse.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, telegram: telegramData })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
