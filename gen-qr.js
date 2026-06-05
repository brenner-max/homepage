const QRCode = require('qrcode');
QRCode.toFile(
  '../../02-brand/qrcode-bremos-org.png',
  'https://bremos.org',
  { width: 800, margin: 2, color: { dark: '#08080a', light: '#ffffff' }, errorCorrectionLevel: 'H' },
  function(err) {
    if (err) console.error(err);
    else console.log('QR code saved to 02-brand/qrcode-bremos-org.png');
  }
);
