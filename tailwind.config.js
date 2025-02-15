/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './src/components/ChatMessage.tsx'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        'input-background': 'var(--input-background)',
        'button-text': 'var(--button-text)',
        'icon-color': 'var(--icon-color)',
        'icon-hover': 'var(--icon-hover)',
        'temp-color': '#ff0000', // Temporary color
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};