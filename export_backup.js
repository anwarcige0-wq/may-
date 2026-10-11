const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'travelsom.db');
const SQL_BACKUP_PATH = path.join(DATA_DIR, 'travelsom_backup.sql');
const DB_BACKUP_PATH = path.join(DATA_DIR, `travelsom_backup_${new Date().toISOString().slice(0, 10)}.db`);

if (!fs.existsSync(DB_PATH)) {
  console.error('Database file not found:', DB_PATH);
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);

console.log('🔄 Billaabaya keydinta xogta SQL (Starting SQL backup)...');

let sqlOutput = `-- =======================================================\n`;
sqlOutput += `-- TRAVEL SOM — SQL DATABASE BACKUP\n`;
sqlOutput += `-- Taariikhda: ${new Date().toISOString()}\n`;
sqlOutput += `-- Database: SQLite (Compatible with MySQL/PostgreSQL with minor adaptations)\n`;
sqlOutput += `-- =======================================================\n\n`;
sqlOutput += `PRAGMA foreign_keys = OFF;\nBEGIN TRANSACTION;\n\n`;

const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

for (const t of tables) {
  const tableName = t.name;
  console.log(`📦 Keydinaya jadwalka: ${tableName}...`);
  
  sqlOutput += `-- -------------------------------------------------------\n`;
  sqlOutput += `-- Jadwalka: ${tableName}\n`;
  sqlOutput += `-- -------------------------------------------------------\n`;
  sqlOutput += `DROP TABLE IF EXISTS "${tableName}";\n`;
  sqlOutput += `${t.sql};\n\n`;

  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
  if (rows.length > 0) {
    for (const row of rows) {
      const cols = Object.keys(row).map(c => `"${c}"`).join(', ');
      const vals = Object.values(row).map(v => {
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      }).join(', ');

      sqlOutput += `INSERT INTO "${tableName}" (${cols}) VALUES (${vals});\n`;
    }
    sqlOutput += `\n`;
  }
}

sqlOutput += `COMMIT;\nPRAGMA foreign_keys = ON;\n`;

fs.writeFileSync(SQL_BACKUP_PATH, sqlOutput, 'utf8');
fs.copyFileSync(DB_PATH, DB_BACKUP_PATH);

console.log('✅ Keydinta xogta si guul leh ayay u dhammaatay!');
console.log(`📄 SQL Dump File:   ${SQL_BACKUP_PATH}`);
console.log(`💾 Binary DB Backup: ${DB_BACKUP_PATH}`);
