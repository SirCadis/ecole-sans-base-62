import { useEffect, useState } from 'react';
import { useSchoolDataSQL } from './useSchoolDataSQL';
import { useTeacherDataSQL } from './useTeacherDataSQL';
import { useGradeDataSQL } from './useGradeDataSQL';
import { useClassScheduleDataSQL } from './useClassScheduleDataSQL';
import { useAttendanceDataSQL } from './useAttendanceDataSQL';

// Hook principal qui remplace tous les anciens hooks localStorage
export const useSchoolData = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Hooks SQLite
  const schoolData = useSchoolDataSQL();
  const teacherData = useTeacherDataSQL();
  const gradeData = useGradeDataSQL();
  const scheduleData = useClassScheduleDataSQL();
  const attendanceData = useAttendanceDataSQL();

  useEffect(() => {
    // Attendre que tous les hooks aient des données ou soient initialisés
    const checkInitialization = () => {
      // Marquer comme initialisé une fois que la base de données répond
      if (!isInitialized) {
        setIsInitialized(true);
        console.log('🚀 Migration vers SQLite terminée - Application prête');
      }
    };

    // Utiliser un petit délai pour permettre l'initialisation asynchrone
    const timer = setTimeout(checkInitialization, 1000);
    return () => clearTimeout(timer);
  }, [isInitialized, schoolData.classes, teacherData.teachers]);

  return {
    isInitialized,
    // Données des étudiants et classes
    students: schoolData.students,
    classes: schoolData.classes,
    addStudent: schoolData.addStudent,
    updateStudent: schoolData.updateStudent,
    deleteStudent: schoolData.deleteStudent,
    addClass: schoolData.addClass,
    updateClass: schoolData.updateClass,
    deleteClass: schoolData.deleteClass,
    getStudentsByClass: schoolData.getStudentsByClass,
    generateStudentNumber: schoolData.generateStudentNumber,
    
    // Données des professeurs
    teachers: teacherData.teachers,
    addTeacher: teacherData.addTeacher,
    updateTeacher: teacherData.updateTeacher,
    deleteTeacher: teacherData.deleteTeacher,
    getTeacherWithSchedule: teacherData.getTeacherWithSchedule,
    
    // Données des matières et notes
    subjects: gradeData.subjects,
    grades: gradeData.grades,
    addSubject: gradeData.addSubject,
    deleteSubject: gradeData.deleteSubject,
    getSubjectsByClassAndSemester: gradeData.getSubjectsByClassAndSemester,
    addOrUpdateGrade: gradeData.addOrUpdateGrade,
    getGradesBySubject: gradeData.getGradesBySubject,
    getStudentGrade: gradeData.getStudentGrade,
    
    // Données des emplois du temps
    classSchedules: scheduleData.classSchedules,
    addClassScheduleSlots: scheduleData.addClassScheduleSlots,
    getScheduleByClass: scheduleData.getScheduleByClass,
    deleteClassSchedule: scheduleData.deleteClassSchedule,
    getAllSchedules: scheduleData.getAllSchedules,
    getScheduleByTeacher: scheduleData.getScheduleByTeacher,
    
    // Données des présences
    attendanceRecords: attendanceData.attendanceRecords,
    addAttendanceRecord: attendanceData.addAttendanceRecord,
    updateAttendanceRecord: attendanceData.updateAttendanceRecord,
    deleteAttendanceRecord: attendanceData.deleteAttendanceRecord,
    getAttendanceByDate: attendanceData.getAttendanceByDate,
    getAttendanceByStudent: attendanceData.getAttendanceByStudent,
    getAttendanceByTeacher: attendanceData.getAttendanceByTeacher,
    getAttendanceByScheduleSlot: attendanceData.getAttendanceByScheduleSlot,
    
    // Méthodes de rechargement
    reloadAllData: () => {
      schoolData.loadData();
      teacherData.loadData();
      gradeData.loadData();
      scheduleData.loadData();
      attendanceData.loadData();
    }
  };
};