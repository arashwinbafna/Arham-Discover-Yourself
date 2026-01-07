
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * GLOBAL SHIM: process.env
 * Integrating the user-provided Gemini API Key as the default fallback.
 * This ensures the performOCR service in geminiService.ts can initialize correctly.
 */
if (typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: {
      API_KEY: (window as any).API_KEY || 'AIzaSyAxAUQgVThHXl15bN-jthJNVEIN6IdbWx4'
    }
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
