/**
 * Copia a pasta api/ para dist/api/ no build. Assim um único deploy (enviar dist) já leva app + API.
 * Exclui .env para não sobrescrever o .env do servidor.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');
const apiSrc = path.resolve(appDir, '..', 'api');
const apiDest = path.resolve(appDir, 'dist', 'api');

const SKIP = new Set(['.env', 'node_modules', '.git']);

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn('copy-api: pasta api não encontrada em', apiSrc);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (SKIP.has(name)) continue;
    const srcPath = path.join(src, name);
    const destPath = path.join(dest, name);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  if (fs.existsSync(path.join(apiSrc, '.env.example'))) {
    fs.copyFileSync(path.join(apiSrc, '.env.example'), path.join(dest, '.env.example'));
  }
  console.log('copy-api: api/ copiada para dist/api/');
}

copyRecursive(apiSrc, apiDest);
