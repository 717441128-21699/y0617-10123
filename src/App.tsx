import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import EventList from "@/pages/EventList";
import EventDetail from "@/pages/EventDetail";
import TaskCenter from "@/pages/TaskCenter";
import KnowledgeBase from "@/pages/KnowledgeBase";
import KnowledgeDetail from "@/pages/KnowledgeDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<EventList />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/tasks" element={<TaskCenter />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
