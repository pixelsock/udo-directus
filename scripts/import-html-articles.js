// Script to import HTML files as articles in Directus
// Usage: node scripts/import-html-articles.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Directus } = require('directus');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const API_TOKEN = process.env.DIRECTUS_API_TOKEN;
if (!API_TOKEN) {
  console.error('Missing DIRECTUS_API_TOKEN in .env');
  process.exit(1);
}

const directus = new Directus(DIRECTUS_URL, {
  auth: {
    staticToken: API_TOKEN
  }
});

const HTML_DIR = path.resolve(__dirname, '../extensions/google-to-html/html-files/cleaned');

async function importArticles() {
  const files = fs.readdirSync(HTML_DIR).filter(f => f.endsWith('.html'));
  for (const file of files) {
    const filePath = path.join(HTML_DIR, file);
    const title = path.basename(file, '.html');
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      await directus.items('articles').createOne({ title, content });
      console.log(`Imported: ${title}`);
    } catch (err) {
      console.error(`Failed to import ${title}:`, err.message);
    }
  }
}

importArticles();
