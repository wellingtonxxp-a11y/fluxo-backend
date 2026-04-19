const convertHTMLtoPDF = require('html-pdf-node');
const fs = require('fs');

const txtContent = fs.readFileSync('CODIGO_COMPLETO_SIMPLES.txt', 'utf8');

function htmlEscape(text) {
  return text.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;');
}

const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body { font-family: monospace; font-size: 9px; line-height: 1.3; white-space: pre-wrap; word-wrap: break-word; margin: 5mm; }</style></head><body>' + htmlEscape(txtContent) + '</body></html>';

const options = {
  format: 'A4',
  margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
  timeout: 30000
};

const file = { content: html };

convertHTMLtoPDF.generatePdf(file, options).then(pdfBuffer => {
  fs.writeFileSync('CODIGO_COMPLETO.pdf', pdfBuffer);
  console.log('✅ PDF criado com sucesso!');
  console.log('📄 Arquivo: CODIGO_COMPLETO.pdf');
  console.log('📊 Tamanho: ' + (pdfBuffer.length / 1024).toFixed(2) + ' KB');
}).catch(err => {
  console.error('❌ Erro:', err.message);
});
