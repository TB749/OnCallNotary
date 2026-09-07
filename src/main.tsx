import React from 'react';
import ReactDOM from 'react-dom/client';
import NotarySite from './NotarySite';
import './index.css';
import Owner from './Owner';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {window.location.pathname === '/owner' ? <Owner /> : <NotarySite />}
  </React.StrictMode>,
);
