#!/usr/bin/env node
/**
 * generate-rss.js
 * Genera feed.xml (RSS 2.0) a partir de posts.json.
 * Uso: node scripts/generate-rss.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://guardianesdelpulque.org';

const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8'));

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Convertir fecha en español a ISO (ej. "18 de marzo de 2026" → "2026-03-18")
const MESES = {
  'enero':'01','febrero':'02','marzo':'03','abril':'04','mayo':'05','junio':'06',
  'julio':'07','agosto':'08','septiembre':'09','octubre':'10','noviembre':'11','diciembre':'12'
};
function parseDate(str) {
  if (!str) return new Date().toUTCString();
  const m = str.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (!m) return new Date().toUTCString();
  return new Date(`${m[3]}-${MESES[m[2].toLowerCase()]}-${m[1].padStart(2,'0')}`).toUTCString();
}

const items = posts.map(p => {
  const url = `${BASE_URL}/${p.url}`;
  const pubDate = parseDate(p.date);
  const image = p.cover ? `<enclosure url="${BASE_URL}/${escape(p.cover)}" type="image/png" length="0"/>` : '';
  return `
    <item>
      <title>${escape(p.title)}</title>
      <link>${escape(url)}</link>
      <guid isPermaLink="true">${escape(url)}</guid>
      <description>${escape(p.excerpt)}</description>
      <category>${escape(p.tag)}</category>
      <pubDate>${pubDate}</pubDate>
      ${image}
    </item>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Guardianes del Pulque</title>
    <link>${BASE_URL}</link>
    <description>Pulque, tierra y maguey: artículos, guías y proyectos.</description>
    <language>es-mx</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/images/logo_transparente.png</url>
      <title>Guardianes del Pulque</title>
      <link>${BASE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

fs.writeFileSync(path.join(ROOT, 'feed.xml'), xml, 'utf8');
console.log(`✅ feed.xml generado con ${posts.length} artículos.`);
