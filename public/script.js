// WhatsApp Configuration
const WHATSAPP_NUMBER = '628988329323';
const WHATSAPP_MESSAGE = 'Halo, saya ingin memesan dari Ambarista Coffee Shop.';

// Function untuk mendapatkan informasi browser
function getBrowserInfo() {
  return {
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
