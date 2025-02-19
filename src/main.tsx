import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('main.tsx - Starting application initialization');

// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find root element');
  throw new Error('Failed to find root element');
}

// Create root
console.log('main.tsx - Creating root');
const root = createRoot(rootElement);

// Handle HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('main.tsx - HMR dispose');
    root.unmount();
  });
}

// Initial render
console.log('main.tsx - Rendering app');
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('main.tsx - App rendered');