// Automated Secret Scanner for TRACE CI and pre-commit
import fs from 'fs';
import path from 'path';

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.venv',
  'venv',
  'coverage',
  '__pycache__',
]);

const SECRET_PATTERNS = [
  { name: 'Private Key Block', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH |)PRIVATE KEY-----/ },
  { name: 'Firebase Hash Signer Key', regex: /"base64SignerKey":\s*"[A-Za-z0-9+/=]{20,}"/ },
  { name: 'Google API Key Pattern', regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'Generic Password In Code', regex: /(?:admin_password|password)\s*[:=]\s*['"][a-zA-Z0-9!@#$%^&*()_+]{4,}['"]/i },
  { name: 'Hardcoded JWT Secret', regex: /ADMIN_SESSION_SECRET\s*=\s*['"][a-zA-Z0-9_-]{8,}['"]/ },
];

const ALLOWED_FILES = new Set(['.env.example', 'ROTATE_SECRETS.md', 'findings.md', 'secret-scan.mjs']);

let issuesFound = 0;

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (ALLOWED_FILES.has(entry.name) || entry.name.endsWith('.md')) continue;
      // Do not scan gitignored .env during local testing, but alert if tracked
      if (entry.name === '.env') {
        console.warn(`[SECRET SCAN WARN] Local .env detected at ${fullPath}. Ensure it is NEVER committed to git.`);
        continue;
      }

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of SECRET_PATTERNS) {
          // Allow dummy test credentials in test files and development seed scripts
          if (pattern.name === 'Generic Password In Code' && (fullPath.includes('tests') || fullPath.includes('seed-dev-admin'))) {
            continue;
          }
          if (pattern.regex.test(content)) {
            console.error(`[CRITICAL SECRET DETECTED] ${pattern.name} found in: ${fullPath}`);
            issuesFound++;
          }
        }
      } catch (err) {
        // Binary file, skip
      }
    }
  }
}

console.log('🔍 Running TRACE Automated Secret Scanner...');
scanDirectory(process.cwd());

if (issuesFound > 0) {
  console.error(`\n❌ Secret scan failed: ${issuesFound} sensitive secret pattern(s) identified.`);
  process.exit(1);
} else {
  console.log('✅ Secret scan clean: No hardcoded credentials or private keys detected.');
  process.exit(0);
}
