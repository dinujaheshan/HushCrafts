const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/user/.gemini/antigravity-ide/brain/af3978b0-d01f-4cc3-acfb-f5b6643631c5';
const destDir = 'f:/Hush Crafts/apps/web/public/images';

const files = [
  { src: 'media__1781862054917.jpg', dest: 'banner-collage-1.jpg' },
  { src: 'media__1781862065637.png', dest: 'banner-collage-2.png' },
  { src: 'media__1781862073979.jpg', dest: 'banner-collage-3.jpg' },
  { src: 'media__1781862084118.jpg', dest: 'banner-collage-4.jpg' }
];

files.forEach(f => {
  const srcPath = path.join(srcDir, f.src);
  const destPath = path.join(destDir, f.dest);
  try {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${f.src} to ${f.dest}`);
  } catch (err) {
    console.error(`Failed to copy ${f.src}:`, err.message);
  }
});
