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
        bg: { DEFAULT: '#0C1220', card: '#111827', sidebar: '#0A0F1A' },
        border: { DEFAULT: '#1F2937', light: '#374151' },
        accent: { blue: '#3B82F6', green: '#10B981', purple: '#8B5CF6', orange: '#F59E0B', red: '#EF4444', cyan: '#06B6D4' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
