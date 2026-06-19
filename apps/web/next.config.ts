import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

// Automatically copy user uploaded media assets to public images
const srcDir = 'C:/Users/user/.gemini/antigravity-ide/brain/af3978b0-d01f-4cc3-acfb-f5b6643631c5';
const destDir = path.join(process.cwd(), 'public/images');

const filesToCopy = [
  { src: 'media__1781862054917.jpg', dest: 'banner-collage-1.jpg' },
  { src: 'media__1781862065637.png', dest: 'banner-collage-2.png' },
  { src: 'media__1781862073979.jpg', dest: 'banner-collage-3.jpg' },
  { src: 'media__1781862084118.jpg', dest: 'banner-collage-4.jpg' }
];

if (fs.existsSync(srcDir)) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  filesToCopy.forEach(f => {
    const srcPath = path.join(srcDir, f.src);
    const destPath = path.join(destDir, f.dest);
    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`[Config] Automatically copied ${f.src} to ${f.dest}`);
      } catch (err: any) {
        console.error(`[Config] Failed to copy ${f.src}:`, err.message);
      }
    } else {
      console.warn(`[Config] Source file does not exist: ${srcPath}`);
    }
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com"
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ]
  }
};

export default nextConfig;
