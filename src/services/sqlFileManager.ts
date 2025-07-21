import { Database } from 'sql.js';
import databaseService from './database';

export interface DatabaseBackup {
  timestamp: string;
  version: string;
  data: Uint8Array;
}

export class SqlFileManager {
  private static instance: SqlFileManager;
  private autoSaveEnabled: boolean = true;
  private readonly DB_FILE_NAME = 'school-database.db';
  private readonly BACKUP_PREFIX = 'school-database-backup';
  
  private constructor() {}
  
  static getInstance(): SqlFileManager {
    if (!SqlFileManager.instance) {
      SqlFileManager.instance = new SqlFileManager();
    }
    return SqlFileManager.instance;
  }

  setAutoSave(enabled: boolean) {
    this.autoSaveEnabled = enabled;
  }

  async autoSaveData() {
    if (!this.autoSaveEnabled) return;
    
    try {
      // Sauvegarder automatiquement toutes les données
      await this.exportAllDataToSQL();
      console.log('🔄 Sauvegarde automatique effectuée');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde automatique:', error);
    }
  }

  /**
   * Exporte la base de données vers un fichier .db
   */
  async exportToFile(db: Database, filename?: string): Promise<void> {
    const data = db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || this.DB_FILE_NAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('💾 Base de données exportée vers:', filename || this.DB_FILE_NAME);
  }

  /**
   * Importe une base de données depuis un fichier .db
   */
  async importFromFile(): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.db,.sqlite,.sqlite3';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          console.log('📂 Base de données importée depuis:', file.name);
          resolve(uint8Array);
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(file);
      };
      
      input.click();
    });
  }

  /**
   * Sauvegarde automatique de la base de données
   */
  async createBackup(db: Database): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${this.BACKUP_PREFIX}-${timestamp}.db`;
    await this.exportToFile(db, filename);
  }

  /**
   * Génère un script SQL de création des tables
   */
  generateCreateTablesSQL(): string {
    return `
-- Script de création des tables pour la base de données scolaire
-- Généré le ${new Date().toISOString()}

-- Table des classes
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  studentCount INTEGER DEFAULT 0
);

-- Table des étudiants
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  birthDate TEXT NOT NULL,
  birthPlace TEXT NOT NULL,
  studentNumber TEXT,
  parentPhone TEXT NOT NULL,
  classId TEXT NOT NULL,
  gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
  FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE CASCADE
);

-- Table des professeurs
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  subject TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  birthDate TEXT NOT NULL,
  gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
  residence TEXT NOT NULL,
  address TEXT,
  city TEXT,
  qualification TEXT
);

-- Table des matières
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  coefficient INTEGER NOT NULL,
  classId TEXT NOT NULL,
  semester TEXT CHECK(semester IN ('1', '2')) NOT NULL,
  FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE CASCADE
);

-- Table des notes
CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  subjectId TEXT NOT NULL,
  type TEXT CHECK(type IN ('devoir', 'composition')) NOT NULL,
  number INTEGER,
  value REAL NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (studentId) REFERENCES students (id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES subjects (id) ON DELETE CASCADE
);

-- Table des créneaux d'emploi du temps
CREATE TABLE IF NOT EXISTS schedule_slots (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacherId TEXT NOT NULL,
  classId TEXT NOT NULL,
  FOREIGN KEY (teacherId) REFERENCES teachers (id) ON DELETE CASCADE,
  FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE CASCADE
);

-- Table des présences
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  studentId TEXT,
  teacherId TEXT,
  scheduleSlotId TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT CHECK(status IN ('present', 'absent', 'late', 'dismissed')) NOT NULL,
  justification TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (studentId) REFERENCES students (id) ON DELETE CASCADE,
  FOREIGN KEY (teacherId) REFERENCES teachers (id) ON DELETE CASCADE,
  FOREIGN KEY (scheduleSlotId) REFERENCES schedule_slots (id) ON DELETE CASCADE
);

-- Données par défaut pour les classes
INSERT OR IGNORE INTO classes (id, name, studentCount) VALUES
  ('1', '6ème A', 0),
  ('2', '6ème B', 0),
  ('3', '5ème A', 0),
  ('4', '4ème A', 0),
  ('5', '3ème A', 0);
`;
  }

  /**
   * Exporte le script SQL de création
   */
  async exportCreateScript(): Promise<void> {
    const sqlScript = this.generateCreateTablesSQL();
    const blob = new Blob([sqlScript], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'create-school-database.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📄 Script SQL de création exporté');
  }

  /**
   * Génère un script SQL d'insertion des données
   */
  generateDataSQL(db: Database): string {
    if (!db) return '';
    
    let sql = `-- Script d'insertion des données\n-- Généré le ${new Date().toISOString()}\n\n`;
    
    const tables = ['classes', 'students', 'teachers', 'subjects', 'grades', 'schedule_slots', 'attendance'];
    
    for (const table of tables) {
      try {
        const stmt = db.prepare(`SELECT * FROM ${table}`);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        
        if (results.length > 0) {
          sql += `-- Données pour la table ${table}\n`;
          sql += `DELETE FROM ${table};\n`;
          
          for (const row of results) {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row).map(v => 
              v === null ? 'NULL' : typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
            ).join(', ');
            sql += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
          }
          sql += '\n';
        }
      } catch (error) {
        console.warn(`Erreur lors de l'export de la table ${table}:`, error);
      }
    }
    
    return sql;
  }

  /**
   * Exporte les données vers un fichier SQL
   */
  async exportDataSQL(db: Database): Promise<void> {
    const sqlScript = this.generateDataSQL(db);
    const blob = new Blob([sqlScript], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-data-${timestamp}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📄 Script SQL de données exporté');
  }

  async exportAllDataToSQL(): Promise<void> {
    try {
      const db = (databaseService as any).db;
      if (!db) throw new Error('Base de données non initialisée');

      const sqlContent = this.generateSQLScript(db);
      
      // Sauvegarder dans localStorage pour persistance
      localStorage.setItem('school_data_sql', sqlContent);
      localStorage.setItem('school_data_sql_timestamp', new Date().toISOString());
      
      console.log('✅ Données sauvegardées en SQL dans localStorage');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde SQL:', error);
      throw error;
    }
  }

  generateSQLScript(db: Database): string {
    if (!db) return '';
    
    let sql = `-- Script SQL complet\n-- Généré le ${new Date().toISOString()}\n\n`;
    
    // Ajouter le script de création des tables
    sql += this.generateCreateTablesSQL();
    sql += '\n\n-- =================== DONNÉES ===================\n\n';
    
    // Ajouter les données
    sql += this.generateDataSQL(db);
    
    return sql;
  }

  async downloadSQLFile(): Promise<void> {
    try {
      const sqlContent = localStorage.getItem('school_data_sql');
      if (!sqlContent) {
        await this.exportAllDataToSQL();
        const newSqlContent = localStorage.getItem('school_data_sql');
        if (!newSqlContent) throw new Error('Impossible de générer le fichier SQL');
        this.downloadSQLContent(newSqlContent);
      } else {
        this.downloadSQLContent(sqlContent);
      }
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement SQL:', error);
      throw error;
    }
  }

  private downloadSQLContent(sqlContent: string): void {
    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school_data_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Sauvegarde périodique automatique
   */
  startAutoBackup(db: Database, intervalMinutes: number = 30): () => void {
    const interval = setInterval(() => {
      this.createBackup(db);
    }, intervalMinutes * 60 * 1000);
    
    console.log(`🔄 Sauvegarde automatique activée (${intervalMinutes} min)`);
    
    return () => {
      clearInterval(interval);
      console.log('🔄 Sauvegarde automatique désactivée');
    };
  }
}

export const sqlFileManager = SqlFileManager.getInstance();
export default sqlFileManager;