const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).sort();

const cutoff = '20260223000000_admin_rbac_v1.sql';
let foundCutoff = false;
let output = '-- AUTOMATIC CATCHUP MIGRATIONS\n\n';

for (const file of files) {
  if (file === cutoff) {
    foundCutoff = true;
    continue;
  }
  if (foundCutoff && file.endsWith('.sql')) {
    output += `\n\n-- MIGRATION: ${file}\n\n`;
    output += fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  }
}

fs.writeFileSync('catchup_migrations.sql', output);
console.log('catchup_migrations.sql generated successfully with ' + output.length + ' bytes.');
