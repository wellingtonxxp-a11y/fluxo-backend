const convertHTMLtoPDF = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

const htmlFilePath = path.join(__dirname, 'CODIGO_COMPLETO.html');
const pdfFilePath = path.join(__dirname, 'CODIGO_COMPLETO.pdf');

const file = { url: 'file://' + htmlFilePath };

const options = {
  format: 'A4',
  margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
  printBackground: true,
  landscape: false,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size: 12px; margin: 0 20px; width: 100%;">Fluxo Backend - Código Completo</div>',
  footerTemplate: '<div style="font-size: 10px; margin: 0 20px; width: 100%; text-align: right;"><span class="pageNumber"></span> de <span class="totalPages"></span></div>',
  timeout: 30000
};

convertHTMLtoPDF.generatePdf(file, options).then(pdfBuffer => {
  fs.writeFileSync(pdfFilePath, pdfBuffer);
  console.log('✅ Arquivo PDF criado com sucesso!');
  console.log('📄 Arquivo: CODIGO_COMPLETO.pdf');
  console.log('📊 Tamanho: ' + (pdfBuffer.length / 1024 / 1024).toFixed(2) + ' MB');
}).catch(err => {
  console.error('❌ Erro ao converter:', err.message);
});
