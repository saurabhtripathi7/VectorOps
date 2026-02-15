import { Outlet } from "react-router-dom";
import ChatSidebar from "../components/Sidebar";

export default function ChatLayout() {
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <ChatSidebar />
      <main className="flex-1 relative bg-[#0a0a0a]">
        <div className="absolute top-0 right-0 w-125 h-125 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
