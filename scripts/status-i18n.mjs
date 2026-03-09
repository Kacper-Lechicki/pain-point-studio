import fs from 'fs';

import { glob } from 'glob';

const TRANSLATION_FILE_PATH = './src/i18n/messages/en.json';
const SRC_PATTERN = './src/**/*.{ts,tsx,js,jsx}';
const ALWAYS_KEEP_PREFIXES = ['error', 'errors.', 'api.', 'common.'];

function flattenKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';

    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flattenKeys(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }

    return acc;
  }, {});
}

function getAncestry(key) {
  const parts = key.split('.');
  const ancestry = [];

  for (let i = parts.length; i > 0; i--) {
    ancestry.push(parts.slice(0, i).join('.'));
  }

  return ancestry;
}

function findDynamicPatterns(content) {
  const patterns = [];
  const templateLiteralRegex = /[`'"]([\w\d_]+\.)+\$\{/g;

  let match;

  while ((match = templateLiteralRegex.exec(content)) !== null) {
    const cleanPrefix = match[0].replace(/[`'"]/, '').replace(/\$\{/, '');
    patterns.push(cleanPrefix);
  }

  const concatRegex = /[`'"]([\w\d_]+\.)+[`'"]\s*\+/g;

  while ((match = concatRegex.exec(content)) !== null) {
    const cleanPrefix = match[0].replace(/[`'"]/g, '').replace(/\s*\+/, '');
    patterns.push(cleanPrefix);
  }

  return patterns;
}

async function runGuardian() {
  console.log('[Info] Starting...');

  let translations;

  try {
    const fileContent = fs.readFileSync(TRANSLATION_FILE_PATH, 'utf8');
    translations = JSON.parse(fileContent);
  } catch (e) {
    console.error(`[Error]: Translation file not found at: ${TRANSLATION_FILE_PATH}`);
    process.exit(1);
  }

  const flatObj = flattenKeys(translations);
  const allKeys = Object.keys(flatObj);
  const filePaths = await glob(SRC_PATTERN);

  const files = filePaths.map((filePath) => ({
    path: filePath,
    content: fs.readFileSync(filePath, 'utf8'),
  }));

  console.log(`[Info] Scanned ${files.length} files. Checking ${allKeys.length} keys...`);

  const dynamicPrefixes = new Set([...ALWAYS_KEEP_PREFIXES]);

  files.forEach((file) => {
    const found = findDynamicPatterns(file.content);
    found.forEach((p) => dynamicPrefixes.add(p));
  });

  if (dynamicPrefixes.size > 0) {
    console.log(`[Info] Dynamic patterns active:`);
    dynamicPrefixes.forEach((p) => console.log(`   ->  ${p}*`));
  }

  const unusedKeys = [];

  allKeys.forEach((key) => {
    for (const prefix of dynamicPrefixes) {
      if (key.startsWith(prefix)) {
        return;
      }
    }

    const ancestry = getAncestry(key);

    let isUsed = false;

    for (const ancestor of ancestry) {
      if (isUsed) {
        break;
      }

      const parts = ancestor.split('.');
      const checks = [{ namespace: null, suffix: ancestor }];

      if (parts.length > 1) {
        for (let i = 1; i < parts.length; i++) {
          checks.push({
            namespace: parts.slice(0, i).join('.'),
            suffix: parts.slice(i).join('.'),
          });
        }
      }

      for (const file of files) {
        for (const check of checks) {
          if (check.namespace === null) {
            if (file.content.indexOf(check.suffix) !== -1) {
              isUsed = true;
              break;
            }
          } else {
            if (
              file.content.indexOf(check.namespace) !== -1 &&
              file.content.indexOf(check.suffix) !== -1
            ) {
              isUsed = true;
              break;
            }
          }
        }

        if (isUsed) {
          break;
        }
      }
    }

    if (!isUsed) {
      unusedKeys.push(key);
    }
  });

  console.log('---------------------------------------------------');

  if (unusedKeys.length > 0) {
    console.log(`[Warn] FOUND ${unusedKeys.length} UNUSED KEYS:\n`);

    unusedKeys.forEach((k) => console.log(`[Error] ${k}`));
    console.log(`\n[Info] This scan included Parent/Ancestry checks.`);

    console.log(
      `   If you use a parent object (e.g. 'metadata.keywords'), all children are marked as safe.`
    );
  } else {
    console.log('[Success] All clear! No unused keys detected.');
  }
}

runGuardian();
