import { useState, useEffect } from 'react';
import { Subject, Grade, Semester, SubjectFormData } from '@/types/grades';
import databaseService from '@/services/database';
import { SqlFileManager } from '@/services/sqlFileManager';

export const useGradeDataSQL = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

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
      const subjectsData = databaseService.getSubjects();
      const gradesData = databaseService.getGrades();
      
      setSubjects(subjectsData);
      setGrades(gradesData);
      
      console.log('📚 Matières et notes chargées depuis SQLite:', { subjects: subjectsData.length, grades: gradesData.length });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des matières et notes:', error);
    }
  };

  const addSubject = async (classId: string, semester: Semester, subjectData: SubjectFormData) => {
    try {
      const id = databaseService.addSubject(classId, semester, subjectData);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      console.log('✅ Matière ajoutée avec l\'ID:', id);
      return id;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la matière:', error);
      return null;
    }
  };

  const deleteSubject = async (subjectId: string) => {
    try {
      databaseService.deleteSubject(subjectId);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      console.log('✅ Matière supprimée:', subjectId);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la matière:', error);
    }
  };

  const getSubjectsByClassAndSemester = (classId: string, semester: Semester) => {
    return subjects.filter(s => s.classId === classId && s.semester === semester);
  };

  const addOrUpdateGrade = async (studentId: string, subjectId: string, type: 'devoir' | 'composition', value: number, number?: number) => {
    try {
      databaseService.addOrUpdateGrade(studentId, subjectId, type, value, number);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      console.log('✅ Note mise à jour:', { studentId, subjectId, type, value, number });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la note:', error);
    }
  };

  const getGradesBySubject = (subjectId: string) => {
    return grades.filter(g => g.subjectId === subjectId);
  };

  const getStudentGrade = (studentId: string, subjectId: string, type: 'devoir' | 'composition', number?: number) => {
    const grade = grades.find(g => 
      g.studentId === studentId && 
      g.subjectId === subjectId && 
      g.type === type && 
      g.number === number
    );
    return grade?.value || null;
  };

  return {
    subjects,
    grades,
    addSubject,
    deleteSubject,
    getSubjectsByClassAndSemester,
    addOrUpdateGrade,
    getGradesBySubject,
    getStudentGrade,
    loadData
  };
};