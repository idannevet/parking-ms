import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#F8FAFC', card: '#FFFFFF', sidebar: '#FFFFFF' },
        border: { DEFAULT: '#E2E8F0', light: '#CBD5E1' },
        accent: { blue: '#3B82F6', green: '#10B981', purple: '#8B5CF6', orange: '#F59E0B', red: '#EF4444', cyan: '#06B6D4' },
      },
      fontFamily: { sans: ['Rubik', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
