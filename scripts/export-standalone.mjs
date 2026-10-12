import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
let html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const script = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
const style = html.match(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/);
if (!script || !style) throw new Error('Expected one bundled script and stylesheet; run npm run build first.');
const js = await readFile(resolve(root, 'dist', script[1].replace(/^\//, '')), 'utf8');
const css = await readFile(resolve(root, 'dist', style[1].replace(/^\//, '')), 'utf8');
html = html.replace(script[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace(style[0], () => `<style>${css}</style>`);
html = html.replace(/<link[^>]*rel="icon"[^>]*>/, '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22%3E%3Crect width=%2240%22 height=%2240%22 rx=%228%22 fill=%22%23102f34%22/%3E%3Cpath d=%22M10 28L20 10L30 28M10 28H30%22 fill=%22none%22 stroke=%22%239bd1c3%22 stroke-width=%224%22/%3E%3C/svg%3E">');
const output = resolve(root, '..', 'fiber-prototype.html');
await writeFile(output, html);
console.log(`Standalone prototype: ${output}`);
