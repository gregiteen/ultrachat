import React, { useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ChatSidebar } from "./ChatSidebar";
import { NavBar } from "./NavBar";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth-service";
import { GlobalAudioPlayer } from "./audio/GlobalAudioPlayer";
import { AudioLibrary } from "./audio/AudioLibrary";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [audioLibraryOpen, setAudioLibraryOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-accent rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ChatSidebar />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            />
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top navigation */}
        <NavBar
          onMenuClick={() => setSidebarOpen(true)}
          onAudioLibraryClick={() => setAudioLibraryOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Audio player */}
        <GlobalAudioPlayer onLibraryOpen={() => setAudioLibraryOpen(true)} />
      </div>

      {/* Audio library */}
      <AudioLibrary 
        isOpen={audioLibraryOpen}
        onClose={() => setAudioLibraryOpen(false)}
        onTrackSelect={() => setAudioLibraryOpen(false)}
      />
    </div>
  );
}