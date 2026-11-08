// MasterTV Tizen Author Signature Generator
// Generates W3C XML Digital Signature (author-signature.xml) for Samsung Smart TV WGT package
// ASCII comments only

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function generateAuthorSignature(stagingDir) {
  const tizenDir = path.join(rootDir, 'tizen');
  const certPath = path.join(tizenDir, 'author.crt');
  const keyPath = path.join(tizenDir, 'author.key');

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error('Author certificate or key not found in tizen/ directory');
  }

  const certPem = fs.readFileSync(certPath, 'utf8');
  const keyPem = fs.readFileSync(keyPath, 'utf8');

  // Extract base64 certificate content without headers/newlines
  const certBase64 = certPem
    .replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/[\r\n\s]/g, '');

  // Recursively gather all files in stagingDir (excluding signature files and zip/wgt)
  function getAllFiles(dir, baseDir = dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getAllFiles(fullPath, baseDir));
      } else {
        const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        // Ignore signature files and temporary files
        if (
          rel === 'author-signature.xml' ||
          rel === 'signature1.xml' ||
          rel.endsWith('.wgt') ||
          rel.endsWith('.zip') ||
          rel === '.htaccess'
        ) {
          continue;
        }
        files.push({ fullPath, rel });
      }
    }
    return files;
  }

  const files = getAllFiles(stagingDir);
  // Sort files by URI for deterministic canonical structure
  files.sort((a, b) => a.rel.localeCompare(b.rel));

  // Build Reference nodes for SignedInfo
  let referencesXml = '';
  for (const f of files) {
    const fileBuffer = fs.readFileSync(f.fullPath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('base64');
    
    referencesXml += `    <Reference URI="${f.rel}">\n` +
      `      <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>\n` +
      `      <DigestValue>${hash}</DigestValue>\n` +
      `    </Reference>\n`;
  }

  // Build SignedInfo element
  const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">\n` +
    `    <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>\n` +
    `    <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>\n` +
    referencesXml +
    `  </SignedInfo>`;

  // Sign canonicalized SignedInfo
  // Node crypto sign RSA-SHA256
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signedInfoXml);
  signer.end();
  const signatureValue = signer.sign(keyPem, 'base64');

  // Format signature value with line breaks every 64 chars
  const formattedSig = signatureValue.match(/.{1,64}/g).join('\n    ');
  const formattedCert = certBase64.match(/.{1,64}/g).join('\n        ');

  // Build full author-signature.xml
  const fullSignatureXml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#" Id="AuthorSignature">\n` +
    `  ${signedInfoXml}\n` +
    `  <SignatureValue>\n    ${formattedSig}\n  </SignatureValue>\n` +
    `  <KeyInfo>\n` +
    `    <X509Data>\n` +
    `      <X509Certificate>\n        ${formattedCert}\n      </X509Certificate>\n` +
    `    </X509Data>\n` +
    `  </KeyInfo>\n` +
    `</Signature>\n`;

  const outputPath = path.join(stagingDir, 'author-signature.xml');
  fs.writeFileSync(outputPath, fullSignatureXml, 'utf8');
  console.log(`[TIZEN SIGN] Successfully generated author-signature.xml with ${files.length} references.`);
  return outputPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const staging = path.join(rootDir, 'tizen-build');
  if (fs.existsSync(staging)) {
    generateAuthorSignature(staging);
  } else {
    console.error('tizen-build directory does not exist.');
  }
}

