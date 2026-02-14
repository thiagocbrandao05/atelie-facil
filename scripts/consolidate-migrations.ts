
import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const archiveDir = path.join(migrationsDir, 'archive');
const outputFile = path.join(migrationsDir, '20260211000000_init_v2.sql');

if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
}

// Get all .sql files excluding the output file and archive folder
const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && f !== '20260211000000_init_v2.sql')
    .sort();

console.log(`Found ${files.length} migration files to consolidate.`);

let consolidatedContent = '-- Consolidated Migration Init V2\n\n';

for (const file of files) {
    console.log(`Processing: ${file}`);
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    consolidatedContent += `\n\n-- ==========================================\n`;
    consolidatedContent += `-- Original Migration: ${file}\n`;
    consolidatedContent += `-- ==========================================\n\n`;
    consolidatedContent += content;
}

// Write to new file
fs.writeFileSync(outputFile, consolidatedContent);
console.log(`✅ Created ${outputFile}`);

// Move old files to archive
for (const file of files) {
    const oldPath = path.join(migrationsDir, file);
    const newPath = path.join(archiveDir, file);
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${file} to archive`);
}

console.log('✅ Consolidation and archiving complete.');
