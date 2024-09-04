const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '_redirects');
const destinationDir  = path.join(__dirname, '../dist/pos-payment/browser/');
const destination = path.join(destinationDir, '_redirects');

// Ensure the destination directory exists
if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

// Copy the file
fs.copyFile(source, destination, (err) => {
  if (err) {
    console.error('Error copying _redirects file:', err);
  } else {
    console.log('_redirects file copied successfully.');
  }
}); 