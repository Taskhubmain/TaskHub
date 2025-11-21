import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/weglot-ugc.css';
import { AuthProvider } from './contexts/AuthContext';
import { RegionProvider } from './contexts/RegionContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RegionProvider>
        <App />
      </RegionProvider>
    </AuthProvider>
  </React.StrictMode>
);
