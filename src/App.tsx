import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/lib/store";
import Dashboard from "@/views/Dashboard";
import ExamView from "@/views/Exam";
import Flashcards from "@/views/Flashcards";
import ModuleDetail from "@/views/ModuleDetail";
import Modules from "@/views/Modules";
import More from "@/views/More";
import Practice from "@/views/Practice";
import Progress from "@/views/Progress";
import Roadmap from "@/views/Roadmap";
import Services from "@/views/Services";
import SettingsView from "@/views/Settings";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function LangAttr() {
  const { lang } = useStore();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <ScrollTop />
      <LangAttr />
      <AppShell>
        <Routes>
          <Route element={<Dashboard />} path="/" />
          <Route element={<Modules />} path="/modules" />
          <Route element={<ModuleDetail />} path="/modules/:id" />
          <Route element={<Practice />} path="/practice" />
          <Route element={<ExamView />} path="/exam/*" />
          <Route element={<Flashcards />} path="/flashcards" />
          <Route element={<Services />} path="/services" />
          <Route element={<Roadmap />} path="/roadmap" />
          <Route element={<Progress />} path="/progress" />
          <Route element={<SettingsView />} path="/settings" />
          <Route element={<More />} path="/more" />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
