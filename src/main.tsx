import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('main.tsx - Starting application initialization');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find root element');
  throw new Error('Failed to find root element');
}

console.log('main.tsx - Found root element, creating root');
const root = createRoot(rootElement);

console.log('main.tsx - Rendering app');
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
console.log('main.tsx - App rendered');