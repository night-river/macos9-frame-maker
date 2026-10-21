/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// 빌드 설정 (docs/frame-maker.md 1장). base는 상대 경로라 저장소 이름과 관계없이 GitHub Pages에서 동작한다
export default defineConfig({
    base: './',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
