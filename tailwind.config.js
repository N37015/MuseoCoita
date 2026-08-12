/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#84A98C',      // Verde claro principal
        'accent': '#52796F',       // Verde más oscuro para acentos y hovers
        'danger': '#d9534f',
        'background': '#f8f9fa',   // Gris muy claro (casi blanco)
        'card': '#ffffff',         // Blanco
        'text-main': '#374151',    // Gris oscuro para texto
        'text-muted': '#6B7280',   // Gris medio para texto secundario
      }
    },
  },
  plugins: [],
}