import initSqlJs, { Database } from 'sql.js';
import { Student, SchoolClass } from '@/types/school';
import { Teacher } from '@/types/teacher';
import { Subject, Grade, Semester } from '@/types/grades';
import { ClassScheduleSlot, AttendanceRecord } from '@/types/schedule';
import sqlFileManager from './sqlFileManager';

class DatabaseService {
  private db: Database | null = null;
  private isInitialized = false;
  private autoBackupCleanup: (() => void) | null = null;

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initialisation de sql.js...');
      
      // Initialiser sql.js avec le WASM
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Essayer de charger la base de données depuis localStorage
      const savedDb = localStorage.getItem('school-database');
      if (savedDb) {
        // Restaurer depuis localStorage
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(uint8Array);
        console.log('📊 Base de données restaurée depuis localStorage');
      } else {
        // Créer une nouvelle base de données
        this.db = new SQL.Database();
        console.log('📊 Nouvelle base de données créée');
      }

      this.initializeTables();
      this.seedDefaultData();
      this.saveToLocalStorage();
      
      // Démarrer la sauvegarde automatique
      this.autoBackupCleanup = sqlFileManager.startAutoBackup(this.db, 30);
      
      this.isInitialized = true;
      console.log('✅ Base de données SQLite initialisée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
      throw error;
    }
  }

  private initializeTables() {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Table des classes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        studentCount INTEGER DEFAULT 0
      )
    `);

    // Table des étudiants
    this.db.exec(`
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
      )
    `);

    // Table des professeurs
    this.db.exec(`
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
      )
    `);

    // Table des matières
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        coefficient INTEGER NOT NULL,
        classId TEXT NOT NULL,
        semester TEXT CHECK(semester IN ('1', '2')) NOT NULL,
        FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE CASCADE
      )
    `);

    // Table des notes
    this.db.exec(`
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
      )
    `);

    // Table des créneaux d'emploi du temps
    this.db.exec(`
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
      )
    `);

    // Table des présences
    this.db.exec(`
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
      )
    `);

    console.log('📊 Tables de base de données créées avec succès');
  }

  private seedDefaultData() {
    if (!this.db) return;

    // Vérifier si des données existent déjà
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM classes');
    const result = stmt.getAsObject();
    const classCount = result.count as number;
    
    if (classCount === 0) {
      // Insérer des classes par défaut
      const insertStmt = this.db.prepare('INSERT INTO classes (id, name, studentCount) VALUES (?, ?, ?)');
      const defaultClasses = [
        { id: '1', name: '6ème A', studentCount: 0 },
        { id: '2', name: '6ème B', studentCount: 0 },
        { id: '3', name: '5ème A', studentCount: 0 },
        { id: '4', name: '4ème A', studentCount: 0 },
        { id: '5', name: '3ème A', studentCount: 0 }
      ];

      for (const cls of defaultClasses) {
        insertStmt.run([cls.id, cls.name, cls.studentCount]);
      }
      
      console.log('🎒 Classes par défaut créées');
    }
  }

  private saveToLocalStorage() {
    if (!this.db) return;
    
    try {
      // Exporter la base de données en tant qu'Uint8Array
      const data = this.db.export();
      // Convertir en JSON pour le stockage
      const jsonData = JSON.stringify(Array.from(data));
      localStorage.setItem('school-database', jsonData);
      console.log('💾 Base de données sauvegardée dans localStorage');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }

  // === MÉTHODES POUR LES CLASSES ===
  getClasses(): SchoolClass[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM classes ORDER BY name');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as SchoolClass);
    }
    return results;
  }

  addClass(classData: Omit<SchoolClass, 'id'>): string {
    if (!this.db) throw new Error('Base de données non initialisée');
    const id = Date.now().toString();
    const stmt = this.db.prepare('INSERT INTO classes (id, name, studentCount) VALUES (?, ?, ?)');
    stmt.run([id, classData.name, classData.studentCount]);
    this.saveToLocalStorage();
    return id;
  }

  updateClass(id: string, classData: Partial<SchoolClass>) {
    if (!this.db) return;
    const fields = Object.keys(classData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(classData);
    const stmt = this.db.prepare(`UPDATE classes SET ${fields} WHERE id = ?`);
    stmt.run([...values, id]);
    this.saveToLocalStorage();
  }

  deleteClass(id: string) {
    if (!this.db) return;
    const stmt = this.db.prepare('DELETE FROM classes WHERE id = ?');
    stmt.run([id]);
    this.saveToLocalStorage();
  }

  updateClassStudentCount(classId: string) {
    if (!this.db) return;
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM students WHERE classId = ?');
    countStmt.bind([classId]);
    countStmt.step();
    const count = countStmt.getAsObject().count as number;
    
    const updateStmt = this.db.prepare('UPDATE classes SET studentCount = ? WHERE id = ?');
    updateStmt.run([count, classId]);
    this.saveToLocalStorage();
  }

  // === MÉTHODES POUR LES ÉTUDIANTS ===
  getStudents(): Student[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM students ORDER BY lastName, firstName');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as Student);
    }
    return results;
  }

  getStudentsByClass(classId: string): Student[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM students WHERE classId = ? ORDER BY lastName, firstName');
    stmt.bind([classId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as Student);
    }
    return results;
  }

  addStudent(studentData: Omit<Student, 'id'>): string {
    if (!this.db) throw new Error('Base de données non initialisée');
    const id = Date.now().toString();
    const stmt = this.db.prepare(`
      INSERT INTO students (id, firstName, lastName, birthDate, birthPlace, studentNumber, parentPhone, classId, gender) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      id,
      studentData.firstName,
      studentData.lastName,
      studentData.birthDate,
      studentData.birthPlace,
      studentData.studentNumber,
      studentData.parentPhone,
      studentData.classId,
      studentData.gender
    ]);
    
    this.updateClassStudentCount(studentData.classId);
    this.saveToLocalStorage();
    return id;
  }

  updateStudent(id: string, studentData: Partial<Student>) {
    if (!this.db) return;
    
    // Récupérer l'ancienne classe si elle change
    const oldStudent = this.db.prepare('SELECT classId FROM students WHERE id = ?');
    oldStudent.bind([id]);
    let oldClassId = null;
    if (oldStudent.step()) {
      oldClassId = oldStudent.getAsObject().classId as string;
    }
    
    const fields = Object.keys(studentData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(studentData);
    const stmt = this.db.prepare(`UPDATE students SET ${fields} WHERE id = ?`);
    stmt.run([...values, id]);
    
    // Mettre à jour les compteurs de classes
    if (oldClassId) {
      this.updateClassStudentCount(oldClassId);
    }
    if (studentData.classId && studentData.classId !== oldClassId) {
      this.updateClassStudentCount(studentData.classId);
    }
    
    this.saveToLocalStorage();
  }

  deleteStudent(id: string) {
    if (!this.db) return;
    
    // Récupérer la classe avant suppression
    const stmt = this.db.prepare('SELECT classId FROM students WHERE id = ?');
    stmt.bind([id]);
    let classId = null;
    if (stmt.step()) {
      classId = stmt.getAsObject().classId as string;
    }
    
    const deleteStmt = this.db.prepare('DELETE FROM students WHERE id = ?');
    deleteStmt.run([id]);
    
    if (classId) {
      this.updateClassStudentCount(classId);
    }
    
    this.saveToLocalStorage();
  }

  // === MÉTHODES POUR LES PROFESSEURS ===
  getTeachers(): Teacher[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM teachers ORDER BY lastName, firstName');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as Teacher);
    }
    return results;
  }

  addTeacher(teacherData: Omit<Teacher, 'id' | 'schedule'>): string {
    if (!this.db) throw new Error('Base de données non initialisée');
    const id = Date.now().toString();
    const stmt = this.db.prepare(`
      INSERT INTO teachers (id, firstName, lastName, subject, phone, email, birthDate, gender, residence, address, city, qualification) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      id,
      teacherData.firstName,
      teacherData.lastName,
      teacherData.subject,
      teacherData.phone,
      teacherData.email,
      teacherData.birthDate,
      teacherData.gender,
      teacherData.residence,
      teacherData.address || null,
      teacherData.city || null,
      teacherData.qualification || null
    ]);
    this.saveToLocalStorage();
    return id;
  }

  updateTeacher(id: string, teacherData: Partial<Teacher>) {
    if (!this.db) return;
    const fields = Object.keys(teacherData).filter(key => key !== 'schedule').map(key => `${key} = ?`).join(', ');
    const values = Object.values(teacherData).filter((_, index) => Object.keys(teacherData)[index] !== 'schedule');
    const stmt = this.db.prepare(`UPDATE teachers SET ${fields} WHERE id = ?`);
    stmt.run([...values, id]);
    this.saveToLocalStorage();
  }

  deleteTeacher(id: string) {
    if (!this.db) return;
    const stmt = this.db.prepare('DELETE FROM teachers WHERE id = ?');
    stmt.run([id]);
    this.saveToLocalStorage();
  }

  // === MÉTHODES POUR LES MATIÈRES ===
  getSubjects(): Subject[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM subjects ORDER BY name');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as Subject);
    }
    return results;
  }

  getSubjectsByClassAndSemester(classId: string, semester: Semester): Subject[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM subjects WHERE classId = ? AND semester = ? ORDER BY name');
    stmt.bind([classId, semester]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as Subject);
    }
    return results;
  }

  addSubject(classId: string, semester: Semester, subjectData: { name: string; coefficient: number }): string {
    if (!this.db) throw new Error('Base de données non initialisée');
    const id = Date.now().toString();
    const stmt = this.db.prepare('INSERT INTO subjects (id, name, coefficient, classId, semester) VALUES (?, ?, ?, ?, ?)');
    stmt.run([id, subjectData.name, subjectData.coefficient, classId, semester]);
    this.saveToLocalStorage();
    return id;
  }

  deleteSubject(subjectId: string) {
    if (!this.db) return;
    const stmt = this.db.prepare('DELETE FROM subjects WHERE id = ?');
    stmt.run([subjectId]);
    this.saveToLocalStorage();
  }

  // === MÉTHODES POUR LES NOTES ===
  getGrades(): Grade[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM grades ORDER BY createdAt DESC');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as Grade);
    }
    return results;
  }

  getGradesBySubject(subjectId: string): Grade[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM grades WHERE subjectId = ? ORDER BY createdAt DESC');
    stmt.bind([subjectId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as Grade);
    }
    return results;
  }

  addOrUpdateGrade(studentId: string, subjectId: string, type: 'devoir' | 'composition', value: number, number?: number) {
    if (!this.db) return;
    
    // Vérifier si la note existe déjà
    const existingStmt = this.db.prepare('SELECT id FROM grades WHERE studentId = ? AND subjectId = ? AND type = ? AND number IS ?');
    existingStmt.bind([studentId, subjectId, type, number || null]);
    
    if (existingStmt.step()) {
      // Mettre à jour la note existante
      const existing = existingStmt.getAsObject();
      const updateStmt = this.db.prepare('UPDATE grades SET value = ? WHERE id = ?');
      updateStmt.run([value, existing.id]);
    } else {
      // Créer une nouvelle note
      const id = Date.now().toString();
      const insertStmt = this.db.prepare('INSERT INTO grades (id, studentId, subjectId, type, number, value, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
      insertStmt.run([id, studentId, subjectId, type, number || null, value, new Date().toISOString()]);
    }
    
    this.saveToLocalStorage();
  }

  getStudentGrade(studentId: string, subjectId: string, type: 'devoir' | 'composition', number?: number): number | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT value FROM grades WHERE studentId = ? AND subjectId = ? AND type = ? AND number IS ?');
    stmt.bind([studentId, subjectId, type, number || null]);
    if (stmt.step()) {
      const result = stmt.getAsObject();
      return result.value as number;
    }
    return null;
  }

  // === MÉTHODES POUR L'EMPLOI DU TEMPS ===
  getScheduleSlots(): ClassScheduleSlot[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM schedule_slots ORDER BY day, startTime');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as ClassScheduleSlot);
    }
    return results;
  }

  getScheduleByClass(classId: string): ClassScheduleSlot[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM schedule_slots WHERE classId = ? ORDER BY day, startTime');
    stmt.bind([classId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as ClassScheduleSlot);
    }
    return results;
  }

  getScheduleByTeacher(teacherId: string): ClassScheduleSlot[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM schedule_slots WHERE teacherId = ? ORDER BY day, startTime');
    stmt.bind([teacherId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as ClassScheduleSlot);
    }
    return results;
  }

  addClassScheduleSlots(classId: string, slots: Omit<ClassScheduleSlot, 'id' | 'classId'>[]) {
    if (!this.db) return;
    
    // Supprimer les anciens créneaux de cette classe
    const deleteStmt = this.db.prepare('DELETE FROM schedule_slots WHERE classId = ?');
    deleteStmt.run([classId]);

    // Ajouter les nouveaux créneaux
    const insertStmt = this.db.prepare('INSERT INTO schedule_slots (id, day, startTime, endTime, subject, teacherId, classId) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    for (const slot of slots) {
      const id = `${classId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      insertStmt.run([id, slot.day, slot.startTime, slot.endTime, slot.subject, slot.teacherId, classId]);
    }
    
    this.saveToLocalStorage();
  }

  deleteClassSchedule(classId: string) {
    if (!this.db) return;
    const stmt = this.db.prepare('DELETE FROM schedule_slots WHERE classId = ?');
    stmt.run([classId]);
    this.saveToLocalStorage();
  }

  deleteTeacherSchedule(teacherId: string) {
    if (!this.db) return;
    const stmt = this.db.prepare('DELETE FROM schedule_slots WHERE teacherId = ?');
    stmt.run([teacherId]);
    this.saveToLocalStorage();
  }

  // === MÉTHODES POUR LES PRÉSENCES ===
  getAttendanceRecords(): AttendanceRecord[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM attendance ORDER BY date DESC, createdAt DESC');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as AttendanceRecord);
    }
    return results;
  }

  addAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'createdAt'>): string {
    if (!this.db) throw new Error('Base de données non initialisée');
    const id = Date.now().toString();
    const stmt = this.db.prepare('INSERT INTO attendance (id, studentId, teacherId, scheduleSlotId, date, status, justification, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run([
      id,
      record.studentId || null,
      record.teacherId || null,
      record.scheduleSlotId,
      record.date,
      record.status,
      record.justification || null,
      new Date().toISOString()
    ]);
    this.saveToLocalStorage();
    return id;
  }

  updateAttendanceRecord(id: string, recordData: Partial<AttendanceRecord>) {
    if (!this.db) return;
    const fields = Object.keys(recordData).filter(key => key !== 'id' && key !== 'createdAt').map(key => `${key} = ?`).join(', ');
    const values = Object.values(recordData).filter((_, index) => {
      const key = Object.keys(recordData)[index];
      return key !== 'id' && key !== 'createdAt';
    });
    const stmt = this.db.prepare(`UPDATE attendance SET ${fields} WHERE id = ?`);
    stmt.run([...values, id]);
    this.saveToLocalStorage();
  }

  deleteAttendanceRecord(id: string) {
    if (!this.db) return;
    const stmt = this.db.prepare('DELETE FROM attendance WHERE id = ?');
    stmt.run([id]);
    this.saveToLocalStorage();
  }

  // === MÉTHODES UTILITAIRES ===
  exportDatabase(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }

  clearLocalStorage() {
    localStorage.removeItem('school-database');
  }

  // === MÉTHODES POUR FICHIERS SQL ===
  
  /**
   * Exporte la base de données vers un fichier .db
   */
  async exportToFile(filename?: string): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');
    await sqlFileManager.exportToFile(this.db, filename);
  }

  /**
   * Importe une base de données depuis un fichier .db
   */
  async importFromFile(): Promise<boolean> {
    try {
      const data = await sqlFileManager.importFromFile();
      if (!data) return false;

      // Arrêter la sauvegarde automatique actuelle
      if (this.autoBackupCleanup) {
        this.autoBackupCleanup();
      }

      // Initialiser sql.js si nécessaire
      if (!this.isInitialized) {
        const SQL = await initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        this.db = new SQL.Database(data);
      } else {
        // Remplacer la base de données actuelle
        const SQL = await initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        this.db = new SQL.Database(data);
      }

      this.saveToLocalStorage();
      
      // Redémarrer la sauvegarde automatique
      this.autoBackupCleanup = sqlFileManager.startAutoBackup(this.db, 30);
      
      console.log('✅ Base de données importée avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'importation:', error);
      return false;
    }
  }

  /**
   * Crée une sauvegarde de la base de données
   */
  async createBackup(): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');
    await sqlFileManager.createBackup(this.db);
  }

  /**
   * Exporte le script de création des tables
   */
  async exportCreateScript(): Promise<void> {
    await sqlFileManager.exportCreateScript();
  }

  /**
   * Exporte les données vers un fichier SQL
   */
  async exportDataSQL(): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');
    await sqlFileManager.exportDataSQL(this.db);
  }

  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    if (this.autoBackupCleanup) {
      this.autoBackupCleanup();
      this.autoBackupCleanup = null;
    }
  }
}

// Instance singleton
export const databaseService = new DatabaseService();
export default databaseService;