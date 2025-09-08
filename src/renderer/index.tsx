import React from 'react';
import { createRoot } from 'react-dom/client';
import { MainPanel } from './pages/MainPanel';
import './styles/main.scss';

// 应用程序组件
const App: React.FC = () => {
  return <MainPanel />;
};

// 渲染应用
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root element not found');
}