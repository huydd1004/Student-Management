import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';

import { App } from './app/App';
import { AuthProvider } from './auth/AuthProvider';
import { PwaUpdatePrompt } from './components/pwa/PwaUpdatePrompt';
import { ThemeProvider } from './theme/ThemeProvider';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Không tìm thấy phần tử #root để khởi tạo ứng dụng React.',
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <PwaUpdatePrompt />
      <AuthProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
