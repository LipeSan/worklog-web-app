import Database from 'better-sqlite3';
import path from 'path';

// Caminho para o banco SQLite
const dbPath = path.join(process.cwd(), 'database', 'database.db');

// Instância do banco SQLite
let db: Database.Database | null = null;

// Função para obter a instância do banco
function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// Função para executar queries (compatível com a interface PostgreSQL)
export async function query(text: string, params: unknown[] = []) {
  const database = getDatabase();
  
  try {
    // Converter sintaxe PostgreSQL ($1, $2) para SQLite (?, ?)
    const sqliteQuery = text.replace(/\$(\d+)/g, '?');
    
    // Determinar se é SELECT ou não
    const isSelect = sqliteQuery.trim().toLowerCase().startsWith('select');
    
    if (isSelect) {
      const stmt = database.prepare(sqliteQuery);
      const rows = stmt.all(...params);
      
      return {
        rows,
        rowCount: rows.length
      };
    } else {
      const stmt = database.prepare(sqliteQuery);
      const result = stmt.run(...params);
      
      // Para INSERT, incluir o ID inserido
      const rows = result.lastInsertRowid ? [{ id: result.lastInsertRowid }] : [];
      
      return {
        rows,
        rowCount: result.changes
      };
    }
  } catch (error) {
    console.error('SQLite query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

// Função para testar a conexão
export async function testConnection() {
  try {
    const result = await query('SELECT datetime("now") as current_time');
    console.log('SQLite connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('SQLite connection failed:', error);
    return false;
  }
}

// Função para obter um cliente (para compatibilidade)
export async function getClient() {
  return {
    query,
    release: () => {} // No-op para SQLite
  };
}

// Graceful shutdown
process.on('SIGINT', () => {
  if (db) {
    db.close();
    console.log('SQLite database connection closed');
  }
  process.exit(0);
});

export default getDatabase;