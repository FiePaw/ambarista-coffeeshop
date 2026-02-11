const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Discord Webhook URL
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1471168535039447123/UjXX0127H7AQXrFVxZGCAww2IITugcxQ2-GeDvtv2Y78haJ0X1rtborGe4u5qvHg4sG6';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Utility function to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip || 
         'Unknown';
}

// Endpoint untuk mencatat klik dan informasi browser
app.post('/api/track-click', (req, res) => {
  const { product, price, browserInfo } = req.body;
  const clientIP = getClientIP(req);
  const timestamp = new Date().toISOString();

  const clickData = {
    ip: clientIP,
    product: product,
    price: price,
    timestamp: timestamp,
    userAgent: req.headers['user-agent'] || 'Unknown',
    browserInfo: browserInfo || {}
  };

  // Kirim ke Discord Webhook
  sendToDiscord(clickData, res);
});

// Utility function untuk mengirim data ke Discord Webhook
function sendToDiscord(clickData, res) {
  const embed = {
    title: '📊 Click Tracking Data',
    color: 10197915, // Warna oranye
    fields: [
      {
        name: 'Product',
        value: clickData.product || 'N/A',
        inline: true
      },
      {
        name: 'Price',
        value: clickData.price || 'N/A',
        inline: true
      },
      {
        name: 'IP Address',
        value: clickData.ip,
        inline: true
      },
      {
        name: 'User Agent',
        value: clickData.userAgent.substring(0, 100) || 'N/A',
        inline: false
      },
      {
        name: 'Browser Info',
        value: JSON.stringify(clickData.browserInfo).substring(0, 100) || 'N/A',
        inline: false
      }
    ],
    timestamp: clickData.timestamp,
    footer: {
      text: 'Ambarista Coffee Shop Tracker'
    }
  };

  const payload = {
    embeds: [embed],
    username: 'Ambarista Tracker'
  };

  fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusCode}`);
      }
      console.log(`Click recorded - IP: ${clickData.ip}, Product: ${clickData.product}`);
      res.json({ success: true, message: 'Click data sent to Discord' });
    })
    .catch(err => {
      console.error('Error sending to Discord:', err);
      res.status(500).json({ success: false, message: 'Error sending data to Discord' });
    });
}

// Endpoint untuk melihat status tracking
app.get('/api/tracking-data', (req, res) => {
  res.json({ 
    message: 'Tracking data is sent to Discord webhook',
    webhook: 'Configured',
    status: 'Active'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Ambarista Coffee Shop Server running at http://localhost:${PORT}`);
});
