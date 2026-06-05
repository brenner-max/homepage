const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function exportSlides() {
  const oldSlideDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\8717c359-6272-489f-9737-8168884161eb';
  const newSlideDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\6e963aa5-234e-4812-9c48-d7db86d3e069';
  
  const outputDir = 'C:\\Users\\User\\Desktop\\ki-os\\04-projects\\bremos-linkedin\\slides';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const slides = [
    { src: path.join(oldSlideDir, 'carousel_slide_1_1776247593122.png'), name: '01-titel.jpg' },
    { src: path.join(oldSlideDir, 'carousel_slide_2_1776247618676.png'), name: '02-email.jpg' },
    { src: path.join(oldSlideDir, 'carousel_slide_3_1776247642945.png'), name: '03-termine.jpg' },
    { src: path.join(oldSlideDir, 'carousel_slide_4_1776247666554.png'), name: '04-angebote.jpg' },
    { src: path.join(newSlideDir, 'carousel_slide_5_new_1776335356088.png'), name: '05-cta.jpg' }
  ];

  for (const slide of slides) {
    const outPath = path.join(outputDir, slide.name);
    await sharp(slide.src)
      .resize(1080, 1080, { fit: 'cover' })
      .jpeg({ quality: 95 })
      .toFile(outPath);
    console.log('Created:', outPath);
  }

  console.log('\nAlle 5 Slides als JPG exportiert nach:', outputDir);
  console.log('Jetzt in LinkedIn als Bilder hochladen (Reihenfolge 01-05)');
}

exportSlides().catch(console.error);
