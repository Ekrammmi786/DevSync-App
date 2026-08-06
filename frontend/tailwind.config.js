import daisyui from 'daisyui';

export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Central 2-colour palette: White + Dark Olive
        olive: {
          50: '#f7f8f4',
          100: '#eef0e6',
          200: '#dce2c7',
          300: '#c3cf9d',
          400: '#a6b76b',
          500: '#8a9c4e',
          600: '#6b7c3a',
          700: '#556B2F', // dark olive (primary/main)
          800: '#465a28',
          900: '#3b4a24',
          950: '#1d2711',
        },
        // Pure white background
        ivory: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui],

  daisyui: {
    themes: [
      {
        olive: {
          "primary": "#556B2F",          // dark olive
          "primary-content": "#ffffff",
          "secondary": "#8a9c4e",        // lighter olive
          "secondary-content": "#1d2711",
          "accent": "#6b7c3a",
          "accent-content": "#ffffff",
          "neutral": "#556B2F",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",         // white background
          "base-200": "#f7f8f4",         // very light olive tint
          "base-300": "#eef0e6",
          "base-content": "#1d2711",     // dark text
          "info": "#556B2F",
          "info-content": "#ffffff",
          "success": "#6b7c3a",
          "success-content": "#ffffff",
          "warning": "#c3cf9d",
          "warning-content": "#1d2711",
          "error": "#a6b76b",
          "error-content": "#1d2711",
          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.375rem",
          "--rounded-badge": "0.25rem",
          "--btn-text-case": "none",
          "--btn-focus-scale": "0.98",
        },
      },
      "light",
      "dark",
    ],
  },
}
