import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/chrome.css';
import './styles/kit.css';
import { App } from './App';
import { DEFAULT_THEME, applyTheme } from './utils/theme';

// TODO(P1): 저장된 프로젝트의 테마로 (3.2)
applyTheme(DEFAULT_THEME);

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
