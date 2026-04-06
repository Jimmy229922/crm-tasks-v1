/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        crmBg: "#151521",
        crmCard: "#1e1e2d",
        crmMuted: "#242438",
        crmBorder: "#2e3045",
        crmText: "#f5f7ff",
        crmSubtext: "#9fa6c7",
        statusBlue: "#3b82f6",
        statusAmber: "#f59e0b",
        statusGreen: "#22c55e",
        statusRed: "#ef4444",
      },
      boxShadow: {
        panel: "0 16px 38px rgba(0, 0, 0, 0.28)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
