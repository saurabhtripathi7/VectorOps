import { Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/ToastProvider";
import LandingPage from "./pages/LandingPage";
import DocsPage from "./pages/DocsPage";
import ChatLanding from "./pages/ChatLanding";
import ChatSessionPage from "./pages/ChatSessionPage";
import ChatLayout from "./layouts/ChatLayout";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route element={<ChatLayout />}>
          <Route path="/chat" element={<ChatLanding />} />
          <Route path="/chat/:id" element={<ChatSessionPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
