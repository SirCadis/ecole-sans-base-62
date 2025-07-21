
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SchoolSidebar } from "./components/SchoolSidebar";
import { useSchoolData } from "./hooks/useSchoolDataMigration";
import { useSettings } from "./hooks/useSettings";
import Registration from "./pages/Registration";
import StudentManagement from "./pages/StudentManagement";
import ClassManagement from "./pages/ClassManagement";
import TeacherRegistration from "./pages/TeacherRegistration";
import TeacherManagement from "./pages/TeacherManagement";
import GradeManagement from "./pages/GradeManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const schoolData = useSchoolData();
  const { settings } = useSettings();
  const [sidebarVisible, setSidebarVisible] = useState(settings.sidebarVisible);

  useEffect(() => {
    setSidebarVisible(settings.sidebarVisible);
  }, [settings.sidebarVisible]);

  const dashboardStats = {
    studentsCount: schoolData.students.length,
    teachersCount: schoolData.teachers.length,
    classesCount: schoolData.classes.length,
  };

  // Afficher un écran de chargement pendant l'initialisation de SQLite
  if (!schoolData.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Initialisation de la base de données...</p>
        </div>
      </div>
    );
  }

  const handleSidebarToggle = (visible: boolean) => {
    setSidebarVisible(visible);
  };

  const handleUpdateClassName = (classId: string, newName: string) => {
    schoolData.updateClass(classId, { name: newName });
  };

  return (
    <div className="min-h-screen flex w-full">
      {sidebarVisible && <SchoolSidebar onSidebarToggle={handleSidebarToggle} />}
      <main className="flex-1 bg-background">
        <Routes>
          <Route path="/" element={<Dashboard stats={dashboardStats} />} />
          <Route path="/inscription" element={
            <Registration 
              classes={schoolData.classes} 
              onAddStudent={schoolData.addStudent} 
            />
          } />
          <Route path="/students" element={
            <StudentManagement 
              students={schoolData.students}
              classes={schoolData.classes}
              onUpdateStudent={schoolData.updateStudent}
              onDeleteStudent={schoolData.deleteStudent}
              getStudentsByClass={schoolData.getStudentsByClass}
            />
          } />
          <Route path="/teacher-registration" element={
            <TeacherRegistration 
              onAddTeacher={schoolData.addTeacher}
            />
          } />
          <Route path="/teachers" element={
            <TeacherManagement 
              teachers={schoolData.teachers}
              onUpdateTeacher={schoolData.updateTeacher}
              onDeleteTeacher={schoolData.deleteTeacher}
            />
          } />
          <Route path="/classes" element={
            <ClassManagement 
              classes={schoolData.classes}
              teachers={schoolData.teachers}
              onAddClass={schoolData.addClass}
              onDeleteClass={schoolData.deleteClass}
              onUpdateClassName={handleUpdateClassName}
            />
          } />
          <Route path="/grades" element={
            <GradeManagement 
              classes={schoolData.classes}
              students={schoolData.students}
              getStudentsByClass={schoolData.getStudentsByClass}
            />
          } />
          <Route path="/attendance" element={
            <AttendanceManagement 
              classes={schoolData.classes}
              students={schoolData.students}
              teachers={schoolData.teachers}
              getStudentsByClass={schoolData.getStudentsByClass}
            />
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
