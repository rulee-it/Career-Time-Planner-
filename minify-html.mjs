import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { minify } from 'html-minifier-terser';

const input = await readFile(new URL('../index.html', import.meta.url), 'utf8');

const output = await minify(input, {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true,
});

await mkdir(new URL('../dist', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/index.html', import.meta.url), output, 'utf8');

console.log('Wrote dist/index.html');
