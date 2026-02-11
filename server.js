const express = require('express');
const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js');
const app = express();
const PORT = process.env.PORT || 3000;

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

  // Path ke dataset.xml
  const datasetPath = path.join(__dirname, 'dataset.xml');

  // Baca file XML yang ada atau buat yang baru
  fs.readFile(datasetPath, 'utf8', (err, data) => {
    let xmlContent;

    if (err && err.code === 'ENOENT') {
      // File tidak ada, buat yang baru
      xmlContent = {
        clicks: {
          click: [clickData]
        }
      };
    } else if (err) {
      console.error('Error reading dataset.xml:', err);
      return res.status(500).json({ success: false, message: 'Error reading file' });
    } else {
      // Parse XML yang ada
      const parser = new xml2js.Parser();
      parser.parseString(data, (parseErr, result) => {
        if (parseErr) {
          console.error('Error parsing XML:', parseErr);
          return res.status(500).json({ success: false, message: 'Error parsing XML' });
        }

        // Tambahkan click baru ke data yang ada
        if (!result.clicks) {
          result.clicks = { click: [] };
        }
        if (!result.clicks.click) {
          result.clicks.click = [];
        }

        // Pastikan click adalah array
        if (!Array.isArray(result.clicks.click)) {
          result.clicks.click = [result.clicks.click];
        }

        result.clicks.click.push(clickData);
        xmlContent = result;

        // Tulis kembali ke file
        writeXMLFile(xmlContent, datasetPath, res);
      });
      return;
    }

    // Untuk file baru, langsung tulis
    writeXMLFile(xmlContent, datasetPath, res);
  });
});

// Utility function untuk menulis XML
function writeXMLFile(xmlContent, filePath, res) {
  const builder = new xml2js.Builder({ rootName: 'clicks' });
  const xml = builder.buildObject(xmlContent.clicks ? xmlContent.clicks : xmlContent);

  fs.writeFile(filePath, xml, (err) => {
    if (err) {
      console.error('Error writing dataset.xml:', err);
      return res.status(500).json({ success: false, message: 'Error writing file' });
    }

    console.log(`Click recorded - IP: ${xmlContent.clicks?.click?.[0]?.ip || 'Unknown'}`);
    res.json({ success: true, message: 'Click data recorded' });
  });
}

// Endpoint untuk melihat data tracking (opsional)
app.get('/api/tracking-data', (req, res) => {
  const datasetPath = path.join(__dirname, 'dataset.xml');
  
  fs.readFile(datasetPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({ error: 'No tracking data yet' });
    }

    const parser = new xml2js.Parser();
    parser.parseString(data, (parseErr, result) => {
      if (parseErr) {
        return res.status(500).json({ error: 'Error parsing data' });
      }
      res.json(result);
    });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Ambarista Coffee Shop Server running at http://localhost:${PORT}`);
});
