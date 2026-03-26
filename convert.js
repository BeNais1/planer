const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = path.join(__dirname, 'logo planer.svg');
const outputPng = path.join(__dirname, 'build', 'icon.png');
const outputIco = path.join(__dirname, 'build', 'icon.ico');

async function convertIcon() {
  try {
    const svgBuffer = fs.readFileSync(inputSvg);
    
    // Create 512x512 PNG for electron-builder
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(outputPng);
      
    console.log('Icon successfully created at build/icon.png');
    
  } catch (error) {
    console.error('Error creating icon:', error);
  }
}

convertIcon();
