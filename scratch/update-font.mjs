import fs from 'fs';

const filePath = 'src/App.css';
let css = fs.readFileSync(filePath, 'utf8');
const beforeCount = (css.match(/Poppins/g) || []).length;
css = css.replace(/Poppins/g, 'Montserrat');
fs.writeFileSync(filePath, css, 'utf8');
const afterCount = (css.match(/Montserrat/g) || []).length;

console.log(`Successfully replaced ${beforeCount} occurrences of Poppins with Montserrat (Total Montserrat now: ${afterCount}).`);

