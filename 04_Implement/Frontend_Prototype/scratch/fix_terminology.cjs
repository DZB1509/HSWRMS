const fs = require('fs');
const path = require('path');

const localesDir = 'E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/Fall26_ISP392_IS2005_G1/04_Implement/Frontend_Prototype/src/i18n/locales';
const langs = ['en', 'vi', 'zh-CN', 'ja', 'fr'];

for (const lang of langs) {
  const file = path.join(localesDir, lang, 'operations.json');
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/"guestName": "Customer Name"/g, '"customerName": "Customer Name"'); 
    content = content.replace(/"guestName": "Guest Name"/g, '"customerName": "Customer Name"'); 
    content = content.replace(/"noAllergies": "No specific allergies or dietary restrictions recorded for this customer."/g, '"noAllergies": "No specific allergies or dietary restrictions recorded for this customer."');
    content = content.replace(/"noAllergies": "No specific allergies or dietary restrictions recorded for this guest."/g, '"noAllergies": "No specific allergies or dietary restrictions recorded for this customer."');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
