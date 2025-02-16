import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Find the index-*.js file in dist/assets
const assetsDir = join(process.cwd(), 'dist', 'assets');
const indexFile = readdirSync(assetsDir)
  .find(file => file.match(/^index-.*\.js$/));

if (!indexFile) {
  console.error('Could not find index-*.js file in dist/assets');
  process.exit(1);
}

// Read the index.html file
const htmlPath = join(process.cwd(), 'dist', 'index.html');
let htmlContent;

try {
  htmlContent = readFileSync(htmlPath, 'utf8');
} catch (error) {
  console.error('Error reading index.html:', error);
  process.exit(1);
}

// Replace the src attribute
const updatedContent = htmlContent.replace(
  /src="\/assets\/index-\*\.js"/,
  `src="/assets/${indexFile}"`
);

// Write the updated content back
try {
  writeFileSync(htmlPath, updatedContent);
  console.log('Successfully updated asset paths in index.html');
} catch (error) {
  console.error('Error writing index.html:', error);
  process.exit(1);
}