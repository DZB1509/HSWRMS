import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { STYLES } from './styles.js';
import { renderSection1 } from './section1_overview.js';
import { renderSection2 } from './section2_master_screens.js';
import { renderSection3 } from './section3_modules1_2_3.js';
import { renderSection4 } from './section4_modules4_5_6.js';
import { renderSection5 } from './section5_catalog_status_deps.js';
import { renderSection6 } from './section6_gaps_review_viva.js';
import { renderVisualTour } from './visual_tour.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_OUTPUT = path.resolve('HSWRMS_Web_UI_Demo_Overview.html');
const PDF_OUTPUT = path.resolve('HSWRMS_Web_UI_Demo_Overview.pdf');

function buildFullHtml() {
  console.log('Compiling HTML document sections...');
  const s1 = renderSection1();
  const s2 = renderSection2();
  const s3 = renderSection3();
  const s4 = renderSection4();
  const s5 = renderSection5();
  const tour = renderVisualTour();
  const s6 = renderSection6();

  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HSWRMS Web UI Demo — Functional & UI/UX Overview</title>
  <style>
${STYLES}
  </style>
</head>
<body>
${s1}
${s2}
${s3}
${s4}
${s5}
${tour}
${s6}
</body>
</html>`;

  fs.writeFileSync(HTML_OUTPUT, fullHtml, 'utf8');
  console.log(`Saved HTML source to: ${HTML_OUTPUT} (${(fullHtml.length / 1024).toFixed(1)} KB)`);
  return HTML_OUTPUT;
}

async function convertHtmlToPdf(htmlPath, pdfPath) {
  console.log('Generating PDF via Chrome headless...');
  const args = [
    '--headless=new',
    '--disable-gpu',
    `--print-to-pdf=${pdfPath}`,
    '--no-pdf-header-footer',
    htmlPath
  ];

  return new Promise((resolve, reject) => {
    const p = spawn(CHROME_PATH, args);
    p.on('close', (code) => {
      if (code === 0 && fs.existsSync(pdfPath)) {
        const stats = fs.statSync(pdfPath);
        console.log(`Successfully generated PDF: ${pdfPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
        resolve(pdfPath);
      } else {
        reject(new Error(`Chrome exited with code ${code}`));
      }
    });
    p.on('error', (err) => reject(err));
  });
}

async function main() {
  const htmlPath = buildFullHtml();
  await convertHtmlToPdf(htmlPath, PDF_OUTPUT);
  console.log('Build process completed successfully.');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
