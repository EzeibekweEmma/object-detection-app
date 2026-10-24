import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDirectory = join(projectRoot, 'node_modules', '@litertjs', 'core', 'wasm');
const targetDirectory = join(projectRoot, 'public', 'litert');
const runtimeFiles = [
  'litert_wasm_compat_internal.js',
  'litert_wasm_compat_internal.wasm',
  'litert_wasm_internal.js',
  'litert_wasm_internal.wasm',
];

await mkdir(targetDirectory, { recursive: true });
await Promise.all(
  runtimeFiles.map((fileName) =>
    copyFile(join(sourceDirectory, fileName), join(targetDirectory, fileName)),
  ),
);
