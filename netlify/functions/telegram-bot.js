const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgjthawzhygycyyfbvdh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnanRoYXd6aHlneWN5eWZidmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTQ4NzUsImV4cCI6MjA2MjM3MDg3NX0._9-RtrQNoowkXKscujLv3BtEsc82hfoJQy2BuVt2DR8'
);

exports.handler = async (event, context) => {
  try {
    const update = JSON.parse(event.body);
    
    // Если пользователь написал /start или открыл Mini App
    if (update.message) {
      const user = update.message.from;
      
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
