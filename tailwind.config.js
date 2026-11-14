/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed',
          600: '#5e17eb',
          700: '#4c1d95',
          800: '#3b0764',
          900: '#1e084a',
          purple: '#5e17eb',
          violet: '#6366f1',
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
          }
        },
        whap: {
          bg: '#f6f5fc',
          card: '#ffffff',
          dark: '#170836',
          purple: '#5e17eb',
          accent: '#7c3aed',
          border: '#ede9fe',
          textDark: '#0f0a21',
          textMuted: '#6b6684',
        },
        uber: {
          black: '#000000',
          dark: '#121212',
          charcoal: '#18181b',
          muted: '#27272a',
          light: '#f4f4f5',
        },
        swiggy: {
          orange: '#fc8019',
          dark: '#e26900',
          light: '#fff4ec',
          coral: '#ff5200',
        },
        rapido: {
          yellow: '#f9d616',
          dark: '#e0bc00',
          light: '#fefce8',
        },
        campus: {
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          slate: '#0f172a',
        }
      },
      boxShadow: {
        'card': '0 2px 14px -2px rgba(94, 23, 235, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 28px -4px rgba(94, 23, 235, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 24px 48px -12px rgba(23, 8, 54, 0.3)',
        'float': '0 10px 30px -5px rgba(94, 23, 235, 0.25), 0 4px 10px -2px rgba(0, 0, 0, 0.06)',
        'nav': '0 -4px 20px -2px rgba(94, 23, 235, 0.07)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
