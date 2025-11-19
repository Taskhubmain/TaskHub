/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        // Mobile devices
        'xs': '360px',
        'xs-375': '375px',
        'xs-390': '390px',
        'xs-414': '414px',
        'xs-428': '428px',
        // Tablets
        'sm': '640px',
        'md': '768px',
        'md-820': '820px',
        'lg': '1024px',
        'lg-1280': '1280px',
        // Desktops
        'xl': '1366px',
        'xl-1440': '1440px',
        'xl-1536': '1536px',
        '2xl': '1920px',
        '3xl': '2560px',
      },
    },
  },
  plugins: [],
};
