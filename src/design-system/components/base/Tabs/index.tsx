import React, { createContext, useContext, ReactNode } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className="space-y-4">{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`flex gap-2 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className = '' }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
        ${isActive 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
        ${className}`}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
}

export function TabsContent({ value, children }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return <div>{children}</div>;
}