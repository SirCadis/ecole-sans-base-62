import { useState, useEffect } from 'react';
import { AttendanceRecord } from '@/types/schedule';
import databaseService from '@/services/database';
import { SqlFileManager } from '@/services/sqlFileManager';

export const useAttendanceDataSQL = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

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
      const recordsData = databaseService.getAttendanceRecords();
      setAttendanceRecords(recordsData);
      console.log('📋 Présences chargées depuis SQLite:', recordsData.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des présences:', error);
    }
  };

  const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
    try {
      const id = databaseService.addAttendanceRecord(record);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      console.log('✅ Présence enregistrée avec l\'ID:', id);
      return id;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de la présence:', error);
      return null;
    }
  };

  const updateAttendanceRecord = async (id: string, recordData: Partial<AttendanceRecord>) => {
    try {
      databaseService.updateAttendanceRecord(id, recordData);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      console.log('✅ Présence mise à jour:', id);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la présence:', error);
    }
  };

  const deleteAttendanceRecord = async (id: string) => {
    try {
      databaseService.deleteAttendanceRecord(id);
      loadData();
      await SqlFileManager.getInstance().autoSaveData(); // Sauvegarde automatique
      console.log('✅ Présence supprimée:', id);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la présence:', error);
    }
  };

  const getAttendanceByDate = (date: string) => {
    return attendanceRecords.filter(record => record.date === date);
  };

  const getAttendanceByStudent = (studentId: string) => {
    return attendanceRecords.filter(record => record.studentId === studentId);
  };

  const getAttendanceByTeacher = (teacherId: string) => {
    return attendanceRecords.filter(record => record.teacherId === teacherId);
  };

  const getAttendanceByScheduleSlot = (scheduleSlotId: string, date: string) => {
    return attendanceRecords.filter(record => 
      record.scheduleSlotId === scheduleSlotId && record.date === date
    );
  };

  return {
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    getAttendanceByDate,
    getAttendanceByStudent,
    getAttendanceByTeacher,
    getAttendanceByScheduleSlot,
    loadData
  };
};