import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Inbox, CheckSquare, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { usePersonalizationStore } from '../store/personalization';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary text-button-text'
        : 'text-foreground hover:bg-muted/50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { fetchPersonalInfo } = usePersonalizationStore();

  React.useEffect(() => {
    if (user) {
      fetchPersonalInfo();
    }
  }, [user, fetchPersonalInfo]);

  if (!user) {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    await signOut(() => navigate('/'));
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-muted z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src="https://imgur.com/EJ0T2co.png" alt="UltraChat" className="h-8 w-auto" />
            <div className="flex items-center gap-2">
              <NavItem
                to="/chat"
                icon={<MessageSquare className="h-5 w-5" />}
                label="Chat"
                isActive={location.pathname === '/chat'}
              />
              <NavItem
                to="/inbox"
                icon={<Inbox className="h-5 w-5" />}
                label="Inbox"
                isActive={location.pathname === '/inbox'}
              />
              <NavItem
                to="/tasks"
                icon={<CheckSquare className="h-5 w-5" />}
                label="Tasks"
                isActive={location.pathname === '/tasks'}
              />
              <NavItem
                to="/account"
                icon={<User className="h-5 w-5" />}
                label="Account"
                isActive={location.pathname === '/account'}
              />
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-foreground hover:bg-muted/50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>
      <main className="pt-16">{children}</main>
    </div>
  );
}