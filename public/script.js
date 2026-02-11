// WhatsApp Configuration
const WHATSAPP_NUMBER = '628988329323';
const WHATSAPP_MESSAGE = 'Woi pesen kopi nya dong 5!';

// Function untuk mendapatkan informasi browser dan device detail
function getBrowserInfo() {
  // Parse user agent dengan UAParser
  const parser = new UAParser();
  const result = parser.getResult();
  
  // Fallback untuk device brand jika tidak terdeteksi
  let deviceBrand = result.device.vendor || 'Unknown';
  let deviceModel = result.device.model || 'Unknown';
  
  // Jika device info masih Unknown, coba parse dari user agent
  if (deviceBrand === 'Unknown' || deviceModel === 'Unknown') {
    const ua = navigator.userAgent;
    
    // Common device brand detection
    if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
      deviceBrand = 'Apple';
      if (ua.includes('iPhone')) deviceModel = 'iPhone';
      else if (ua.includes('iPad')) deviceModel = 'iPad';
      else deviceModel = 'iPod';
    } else if (ua.includes('Samsung')) {
      deviceBrand = 'Samsung';
      deviceModel = 'Samsung';
    } else if (ua.includes('Pixel')) {
      deviceBrand = 'Google';
      deviceModel = 'Pixel';
    } else if (ua.includes('Xiaomi')) {
      deviceBrand = 'Xiaomi';
      deviceModel = 'Xiaomi';
    } else if (ua.includes('OPPO')) {
      deviceBrand = 'OPPO';
      deviceModel = 'OPPO';
    } else if (ua.includes('Vivo')) {
      deviceBrand = 'Vivo';
      deviceModel = 'Vivo';
    } else if (ua.includes('Realme')) {
      deviceBrand = 'Realme';
      deviceModel = 'Realme';
    } else if (ua.includes('OnePlus')) {
      deviceBrand = 'OnePlus';
      deviceModel = 'OnePlus';
    } else if (ua.includes('Huawei')) {
      deviceBrand = 'Huawei';
      deviceModel = 'Huawei';
    }
  }
  
  const deviceInfo = {
    // Device Information
    deviceType: result.device.type || 'Desktop',
    deviceBrand: deviceBrand,
    deviceModel: deviceModel,
    
    // OS Information
    osName: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
    
    // Browser Information
    browserName: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    browserEngine: result.engine.name || 'Unknown',
    
    // Device Screen
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    devicePixelRatio: window.devicePixelRatio || 1,
    
    // System Information
    language: navigator.language || 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
    platform: navigator.platform || 'Unknown',
    
    // Additional Info
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  return {
    deviceInfo: deviceInfo,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString()
  };
}

// Function untuk mengirim tracking data ke server
function trackClick(productName, price) {
  const browserInfo = getBrowserInfo();
  
  fetch('/api/track-click', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product: productName,
      price: price,
      browserInfo: browserInfo
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Click tracked:', data);
  })
  .catch(error => {
    console.error('❌ Error tracking click:', error);
  });
}

// Order Product
function orderProduct(productName, price) {
    // Track click
    trackClick(productName, price);
    
    const message = `Halo, saya ingin memesan:\n\n📌 *${productName}*\n💰 Harga: Rp ${price.toLocaleString('id-ID')}\n\nMohon konfirmasi ketersediaan. Terima kasih!`;
    openWhatsAppWithMessage(message);
}

// Open WhatsApp
function openWhatsApp() {
    trackClick('General Inquiry', 0);
    openWhatsAppWithMessage(WHATSAPP_MESSAGE);
}

// Open WhatsApp with Custom Message
function openWhatsAppWithMessage(message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}


function sendPelitMessage() {
    trackClick('Pelit Message', 0);
    openWhatsAppWithMessage('pelit lu');
    closePromoModal();
}

// Scroll to Section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Track scroll navigation
        trackClick(`Navigate to ${sectionId}`, 0);
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Scroll Carousel
function scrollCarousel(direction) {
    const carousel = document.querySelector('.products-carousel');
    const scrollAmount = 350;
    
    if (direction === 'left') {
        carousel.scrollLeft -= scrollAmount;
    } else if (direction === 'right') {
        carousel.scrollLeft += scrollAmount;
    }
    
    trackClick(`Scroll carousel ${direction}`, 0);
}

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            // Track navigation click
            trackClick(`Link click: ${targetId}`, 0);
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Ambarista Coffee Shop Website Loaded!');
    
    // Track page load
    trackClick('Page Load', 0);
});

// Promo Modal Functions
function openPromoModal() {
    const modal = document.getElementById('promoModal');
    modal.classList.add('show');
    trackClick('Open Promo Modal', 0);
}

function closePromoModal() {
    const modal = document.getElementById('promoModal');
    modal.classList.remove('show');
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('promoModal');
    if (event.target === modal) {
        closePromoModal();
    }
});
