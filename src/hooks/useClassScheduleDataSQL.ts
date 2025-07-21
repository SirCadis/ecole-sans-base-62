import { useState, useEffect } from 'react';
import { ClassScheduleSlot } from '@/types/schedule';
import databaseService from '@/services/database';
import { SqlFileManager } from '@/services/sqlFileManager';

export const useClassScheduleDataSQL = () => {
  const [classSchedules, setClassSchedules] = useState<ClassScheduleSlot[]>([]);

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
      const schedulesData = databaseService.getScheduleSlots();
      setClassSchedules(schedulesData);
      console.log('📅 Emplois du temps chargés depuis SQLite:', schedulesData.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des emplois du temps:', error);
    }
  };

  const addClassScheduleSlots = async (classId: string, slots: Omit<ClassScheduleSlot, 'id' | 'classId'>[]) => {
    try {
      databaseService.addClassScheduleSlots(classId, slots);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Créneaux d\'emploi du temps ajoutés pour la classe:', classId);
      console.log('📄 Fichier SQL mis à jour automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout des créneaux d\'emploi du temps:', error);
    }
  };

  const getScheduleByClass = (classId: string) => {
    return classSchedules.filter(s => s.classId === classId);
  };

  const deleteClassSchedule = async (classId: string) => {
    try {
      databaseService.deleteClassSchedule(classId);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      await SqlFileManager.getInstance().exportAllDataToSQL(); // Génération fichier SQL
      console.log('✅ Emploi du temps supprimé pour la classe:', classId);
      console.log('📄 Fichier SQL mis à jour automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'emploi du temps:', error);
    }
  };

  const getAllSchedules = () => {
    return classSchedules;
  };

  const getScheduleByTeacher = (teacherId: string) => {
    return classSchedules.filter(s => s.teacherId === teacherId);
  };

  return {
    classSchedules,
    addClassScheduleSlots,
    getScheduleByClass,
    deleteClassSchedule,
    getAllSchedules,
    getScheduleByTeacher,
    loadData
  };
};