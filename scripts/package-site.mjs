import { cp, mkdir, rm } from 'node:fs/promises';

// Publish only the browser assets, rather than the source repository.
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const asset of ['index.html', 'workout-plan.html', 'app.js', 'styles.css', 'vendor']) {
  await cp(new URL('../' + asset, import.meta.url), new URL(asset, output), { recursive: true });
}
console.log('Packaged static site in dist/');
