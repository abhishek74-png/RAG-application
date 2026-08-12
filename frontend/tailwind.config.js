/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        'on-primary': "var(--on-primary)",
        ink: "var(--ink)",
        body: "var(--body)",
        mute: "var(--mute)",
        hairline: "var(--hairline)",
        'hairline-strong': "var(--hairline-strong)",
        canvas: "var(--canvas)",
        'canvas-soft': "var(--canvas-soft)",
        'canvas-soft-2': "var(--canvas-soft-2)",
        link: "var(--link)",
        'link-deep': "var(--link-deep)",
        'link-soft': "var(--link-soft)",
        success: "var(--success)",
        error: "var(--error)",
        'error-soft': "var(--error-soft)",
        'error-deep': "var(--error-deep)",
        warning: "var(--warning)",
        'warning-soft': "var(--warning-soft)",
        'warning-deep': "var(--warning-deep)",
        
        // Custom background colors for mesh
        'mesh-1': "#007cf0",
        'mesh-2': "#00dfd8",
        'mesh-3': "#7928ca",
        'mesh-4': "#ff0080",
        'mesh-5': "#ff4d4d",
        'mesh-6': "#f9cb28"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'level-1': '0 0 0 1px var(--hairline)',
        'level-2': '0px 2px 4px rgba(0,0,0,0.05), 0 0 0 1px var(--hairline)',
        'level-3': '0px 4px 8px rgba(0,0,0,0.05), 0px 16px 24px -8px rgba(0,0,0,0.1), 0 0 0 1px var(--hairline)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
