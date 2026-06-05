const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createCarouselPDF() {
  const pdfDoc = await PDFDocument.create();
  
  const oldSlideDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\8717c359-6272-489f-9737-8168884161eb';
  const newSlideDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\6e963aa5-234e-4812-9c48-d7db86d3e069';
  
  // Slides 1-4 from old session, slide 5 new with monika-brenner.com
  const slides = [
    path.join(oldSlideDir, 'carousel_slide_1_1776247593122.png'),
    path.join(oldSlideDir, 'carousel_slide_2_1776247618676.png'),
    path.join(oldSlideDir, 'carousel_slide_3_1776247642945.png'),
    path.join(oldSlideDir, 'carousel_slide_4_1776247666554.png'),
    path.join(newSlideDir, 'carousel_slide_5_new_1776335356088.png')
  ];

  for (const imgPath of slides) {
    const imgBytes = fs.readFileSync(imgPath);
    
    // Try JPEG first, fall back to PNG
    let img;
    try {
      img = await pdfDoc.embedJpg(imgBytes);
    } catch {
      img = await pdfDoc.embedPng(imgBytes);
    }
    
    // LinkedIn carousel: 1080x1080 square
    const page = pdfDoc.addPage([1080, 1080]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: 1080,
      height: 1080
    });
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = 'C:\\Users\\User\\Desktop\\ki-os\\04-projects\\bremos-linkedin\\linkedin-karussell-checkliste.pdf';
  fs.writeFileSync(outputPath, pdfBytes);
  console.log('PDF created:', outputPath);
  console.log('Pages:', slides.length);
}

createCarouselPDF().catch(console.error);
