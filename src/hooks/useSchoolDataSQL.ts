import { useState, useEffect } from 'react';
import { Student, SchoolClass, StudentFormData } from '@/types/school';
import databaseService from '@/services/database';
import { SqlFileManager } from '@/services/sqlFileManager';

export const useSchoolDataSQL = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  // Charger les données depuis SQLite
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await databaseService.initialize();
        loadData();
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
      }
    };
    
    initializeDatabase();
  }, []);

  const loadData = () => {
    try {
      const studentsData = databaseService.getStudents();
      const classesData = databaseService.getClasses();
      
      setStudents(studentsData);
      setClasses(classesData);
      
      console.log('📊 Données chargées depuis SQLite:', { students: studentsData.length, classes: classesData.length });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
    }
  };

  const addStudent = async (studentData: StudentFormData) => {
    try {
      const id = databaseService.addStudent(studentData);
      loadData(); // Recharger les données pour mettre à jour les compteurs
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Étudiant ajouté avec l\'ID:', id);
      console.log('📄 Fichier SQL mis à jour automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'étudiant:', error);
    }
  };

  const updateStudent = async (id: string, updatedData: Partial<Student>) => {
    try {
      databaseService.updateStudent(id, updatedData);
      loadData(); // Recharger pour mettre à jour les compteurs si nécessaire
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Étudiant mis à jour:', id);
      console.log('📄 Fichier SQL mis à jour automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'étudiant:', error);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      databaseService.deleteStudent(id);
      loadData(); // Recharger pour mettre à jour les compteurs
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Étudiant supprimé:', id);
      console.log('📄 Fichier SQL mis à jour automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'étudiant:', error);
    }
  };

  const addClass = async (name: string) => {
    try {
      const id = databaseService.addClass({ name, studentCount: 0 });
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Classe ajoutée avec l\'ID:', id);
      console.log('📄 Fichier SQL mis à jour automatiquement');
      return id;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la classe:', error);
      return null;
    }
  };

  const updateClass = async (id: string, updatedData: Partial<SchoolClass>) => {
    try {
      databaseService.updateClass(id, updatedData);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Classe mise à jour:', id);
      console.log('📄 Fichier SQL mis à jour automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la classe:', error);
    }
  };

  const deleteClass = async (id: string) => {
    try {
      databaseService.deleteClass(id);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Classe supprimée:', id);
      console.log('📄 Fichier SQL mis à jour automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la classe:', error);
    }
  };

  const getStudentsByClass = (classId: string) => {
    return students.filter(student => student.classId === classId);
  };

  const generateStudentNumber = () => {
    const currentYear = new Date().getFullYear();
    const existingNumbers = students
      .map(s => s.studentNumber)
      .filter(num => num?.startsWith(currentYear.toString()))
      .map(num => parseInt(num?.slice(-4) || '0'))
      .sort((a, b) => b - a);
    
    const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;
    return `${currentYear}${nextNumber.toString().padStart(4, '0')}`;
  };

  return {
    students,
    classes,
    addStudent,
    updateStudent,
    deleteStudent,
    addClass,
    updateClass,
    deleteClass,
    getStudentsByClass,
    generateStudentNumber,
    loadData
  };
};