import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/chrome.css';
import './styles/kit.css';
import { App } from './App';
import { DEFAULT_THEME, applyTheme } from './utils/theme';

// 불러오기 전 기본 테마 (불러오면 프로젝트의 테마로 바뀐다, project/persist.ts)
applyTheme(DEFAULT_THEME);

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
