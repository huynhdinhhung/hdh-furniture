const fs = require('fs');

// Windows-1252 to byte mapping for 0x80 - 0x9F
const win1252ToByte = {
  '\u20AC': 0x80, '\u201A': 0x82, '\u0192': 0x83, '\u201E': 0x84,
  '\u2026': 0x85, '\u2020': 0x86, '\u2021': 0x87, '\u02C6': 0x88,
  '\u2030': 0x89, '\u0160': 0x8A, '\u2039': 0x8B, '\u0152': 0x8C,
  '\u017D': 0x8E, '\u2018': 0x91, '\u2019': 0x92, '\u201C': 0x93,
  '\u201D': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
  '\u02DC': 0x98, '\u2122': 0x99, '\u0161': 0x9A, '\u203A': 0x9B,
  '\u0153': 0x9C, '\u017E': 0x9E, '\u0178': 0x9F
};

function fixMojibake(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('Ã') && !content.includes('áº') && !content.includes('á»') && !content.includes('Æ')) {
    return;
  }

  const bytes = [];
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (win1252ToByte[char] !== undefined) {
      bytes.push(win1252ToByte[char]);
    } else {
      let code = char.charCodeAt(0);
      bytes.push(code & 0xFF);
    }
  }

  const fixed = Buffer.from(bytes).toString('utf8');
  if (fixed.includes('\uFFFD')) {
     console.log(`Failed to fix ${filePath} (contains replacement character)`);
  }
  
  fs.writeFileSync(filePath, fixed, 'utf8');
  console.log(`Fixed ${filePath}`);
}

const files = [
  'src/app/tai-khoan/page.tsx',
  'src/app/layout.tsx',
  'src/app/admin/page.tsx',
  'src/components/home-hero.tsx',
  'src/components/chat-widget.tsx'
];

files.forEach(fixMojibake);
