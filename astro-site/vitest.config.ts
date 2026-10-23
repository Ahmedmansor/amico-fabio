import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'node',include:['src/features/**/domain/__tests__/*.test.ts','src/shared/data/__tests__/*.test.ts']}});
