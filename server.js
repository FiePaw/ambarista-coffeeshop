const express = require('express');
const path = require('path');
const axios = require('axios');
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
  let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           req.ip || 
           'Unknown';
  
  // Normalize IPv6 addresses
  // Handle IPv6 localhost (::1)
  if (ip === '::1') {
    ip = '127.0.0.1';
  }
  // Handle IPv4-mapped IPv6 (::ffff:192.168.1.1)
  if (ip?.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  
  return ip;
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

  // Fetch geolocation dari IP
  fetchGeolocation(clientIP, clickData, res);
});

// Cache untuk geolocation data
const geolocationCache = new Map();

// Utility function untuk mendapatkan geolocation dari IP dengan retry logic
function fetchGeolocation(ip, clickData, res, retryCount = 0) {
  const MAX_RETRIES = 3;
  
  // Skip geolocation untuk localhost dan private IP
  if (ip === '127.0.0.1' || ip === 'Unknown' || ip === '::1' || 
      ip.startsWith('192.168') || ip.startsWith('10.') || ip.startsWith('172.')) {
    clickData.geolocation = {
      country: 'Local/Private',
      city: 'Localhost',
      region: 'N/A',
      timezone: 'N/A',
      isp: 'Local Network',
      organization: 'Local',
      latitude: 0,
      longitude: 0
    };
    console.log(`[Local IP] ${ip} - Using local geolocation`);
    sendToDiscord(clickData, res);
    return;
  }

  // Check cache
  if (geolocationCache.has(ip)) {
    console.log(`[GeoIP Cache] Using cached data for IP: ${ip}`);
    clickData.geolocation = geolocationCache.get(ip);
    sendToDiscord(clickData, res);
    return;
  }

  console.log(`[GeoIP Lookup] Fetching geolocation for IP: ${ip} (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
  
  // Gunakan ipinfo.io sebagai primary API dengan fallback ke ip-api.com
  axios.get(`https://ipinfo.io/${ip}?token=e688f0b4ce7f3f`, {
    timeout: 5000,
    headers: {
      'User-Agent': 'Ambarista-Tracker/1.0'
    }
  })
    .then(response => {
      const geoData = response.data;
      
      const geolocation = {
        country: geoData.country || 'Unknown',
        city: geoData.city || 'Unknown',
        region: geoData.region || 'Unknown',
        timezone: geoData.timezone || 'Unknown',
        isp: geoData.org || 'Unknown',
        organization: geoData.org || 'Unknown',
        latitude: geoData.loc ? parseFloat(geoData.loc.split(',')[0]) : 0,
        longitude: geoData.loc ? parseFloat(geoData.loc.split(',')[1]) : 0,
        status: 'success'
      };
      
      // Cache hasil
      geolocationCache.set(ip, geolocation);
      
      clickData.geolocation = geolocation;
      
      console.log(`[GeoIP Success] Country: ${geoData.country}, City: ${geoData.city}, ISP: ${geoData.org}`);
      sendToDiscord(clickData, res);
    })
    .catch(err => {
      console.warn(`[GeoIP Fallback] ipinfo.io failed (${err.message}), trying ip-api.com...`);
      
      // Fallback ke ip-api.com
      axios.get(`https://ip-api.com/json/${ip}?fields=country,city,regionName,timezone,isp,org,lat,lon,status`, {
        timeout: 5000
      })
        .then(response => {
          const geoData = response.data;
          
          if (geoData.status === 'fail') {
            throw new Error(`API status: ${geoData.status}`);
          }
          
          const geolocation = {
            country: geoData.country || 'Unknown',
            city: geoData.city || 'Unknown',
            region: geoData.regionName || 'Unknown',
            timezone: geoData.timezone || 'Unknown',
            isp: geoData.isp || 'Unknown',
            organization: geoData.org || 'Unknown',
            latitude: geoData.lat || 0,
            longitude: geoData.lon || 0,
            status: 'success'
          };
          
          // Cache hasil
          geolocationCache.set(ip, geolocation);
          
          clickData.geolocation = geolocation;
          
          console.log(`[GeoIP Success (ip-api)] Country: ${geoData.country}, City: ${geoData.city}, ISP: ${geoData.isp}`);
          sendToDiscord(clickData, res);
        })
        .catch(fallbackErr => {
          // Retry dengan backoff exponential
          if (retryCount < MAX_RETRIES) {
            const delayMs = Math.pow(2, retryCount) * 1000;
            console.log(`[GeoIP Retry] Retrying in ${delayMs}ms...`);
            setTimeout(() => {
              fetchGeolocation(ip, clickData, res, retryCount + 1);
            }, delayMs);
          } else {
            console.error(`[GeoIP Error] All retry attempts failed for IP ${ip}:`, fallbackErr.message);
            
            // Gunakan default/unknown data
            const geolocation = {
              country: 'Unknown',
              city: 'Unknown',
              region: 'Unknown',
              timezone: 'Unknown',
              isp: 'Unknown',
              organization: 'Unknown',
              latitude: 0,
              longitude: 0,
              status: 'failed',
              error: fallbackErr.message
            };
            
            clickData.geolocation = geolocation;
            sendToDiscord(clickData, res);
          }
        });
    });
}

// Utility function untuk mengirim data ke Discord Webhook
function sendToDiscord(clickData, res) {
  // Parse device info dari browser info
  const deviceInfo = clickData.browserInfo.deviceInfo || {};
  
  const embed = {
    title: '📊 Click Tracking Data',
    color: 10197915, // Warna oranye
    fields: [
      {
        name: '🛍️ Product',
        value: clickData.product || 'N/A',
        inline: true
      },
      {
        name: '💰 Price',
        value: clickData.price || 'N/A',
        inline: true
      },
      {
        name: '🌍 Country',
        value: clickData.geolocation?.country || 'N/A',
        inline: true
      },
      {
        name: '🏙️ City',
        value: clickData.geolocation?.city || 'N/A',
        inline: true
      },
      {
        name: '📍 Region',
        value: clickData.geolocation?.region || 'N/A',
        inline: true
      },
      {
        name: '⏰ Timezone',
        value: clickData.geolocation?.timezone || 'N/A',
        inline: true
      },
      {
        name: '📱 Device Type',
        value: deviceInfo.deviceType || 'N/A',
        inline: true
      },
      {
        name: '🖥️ Device Brand',
        value: deviceInfo.deviceBrand || 'N/A',
        inline: true
      },
      {
        name: '📲 Device Model',
        value: deviceInfo.deviceModel || 'N/A',
        inline: true
      },
      {
        name: '⚙️ OS',
        value: `${deviceInfo.osName} ${deviceInfo.osVersion}` || 'N/A',
        inline: true
      },
      {
        name: '🌐 Browser',
        value: `${deviceInfo.browserName} ${deviceInfo.browserVersion}` || 'N/A',
        inline: true
      },
      {
        name: '📺 Screen Resolution',
        value: deviceInfo.screenResolution || 'N/A',
        inline: true
      },
      {
        name: '🕵️ ISP',
        value: (clickData.geolocation?.isp || 'N/A').substring(0, 50),
        inline: true
      },
      {
        name: '🏢 Organization',
        value: (clickData.geolocation?.organization || 'N/A').substring(0, 50),
        inline: true
      },
      {
        name: '🌐 Language',
        value: deviceInfo.language || 'N/A',
        inline: true
      },
      {
        name: '🔗 IP Address',
        value: clickData.ip,
        inline: false
      },
      {
        name: '📍 Coordinates',
        value: `[${clickData.geolocation?.latitude || 0}, ${clickData.geolocation?.longitude || 0}]`,
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
