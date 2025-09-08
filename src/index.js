import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// 检查Electron环境
const isElectron = window.electronAPI !== undefined;

if (isElectron) {
  console.log('运行在Electron环境');
} else {
  console.log('运行在浏览器环境');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);