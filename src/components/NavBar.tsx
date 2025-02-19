import React from "react";
import { Menu } from "lucide-react";

interface NavBarProps {
  onMenuClick: () => void;
  onAudioLibraryClick: () => void;
}

export function NavBar({ onMenuClick, onAudioLibraryClick }: NavBarProps) {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-accent rounded-md lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-4">
          <button
            onClick={onAudioLibraryClick}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Audio Library
          </button>
        </div>
      </div>
    </header>
  );
}