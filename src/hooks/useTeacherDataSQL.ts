import { useState, useEffect } from 'react';
import { Teacher, TeacherFormData } from '@/types/teacher';
import databaseService from '@/services/database';
import { SqlFileManager } from '@/services/sqlFileManager';

export const useTeacherDataSQL = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);

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
      const teachersData = databaseService.getTeachers();
      setTeachers(teachersData);
      console.log('👨‍🏫 Professeurs chargés depuis SQLite:', teachersData.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des professeurs:', error);
    }
  };

  const addTeacher = async (teacherData: TeacherFormData) => {
    try {
      const id = databaseService.addTeacher(teacherData);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Professeur ajouté avec l\'ID:', id);
      console.log('📄 Fichier SQL mis à jour automatiquement');
      return id;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du professeur:', error);
      return null;
    }
  };

  const updateTeacher = async (id: string, updatedData: Partial<Teacher>) => {
    try {
      databaseService.updateTeacher(id, updatedData);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Professeur mis à jour:', id);
      console.log('📄 Fichier SQL mis à jour automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du professeur:', error);
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      // Supprimer aussi l'emploi du temps du professeur
      databaseService.deleteTeacherSchedule(id);
      databaseService.deleteTeacher(id);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Professeur supprimé:', id);
      console.log('📄 Fichier SQL mis à jour automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du professeur:', error);
    }
  };

  const getTeacherWithSchedule = (id: string) => {
    try {
      const teacher = teachers.find(t => t.id === id);
      if (teacher) {
        const schedule = databaseService.getScheduleByTeacher(id);
        return {
          ...teacher,
          schedule: schedule.map(slot => ({
            id: slot.id,
            day: slot.day.toLowerCase() as any,
            startTime: slot.startTime,
            endTime: slot.endTime,
            className: slot.subject
          }))
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du professeur avec emploi du temps:', error);
      return null;
    }
  };

  return {
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacherWithSchedule,
    loadData
  };
};