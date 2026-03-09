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
          blue: "#3b82f6",
          purple: "#8b5cf6",
          cyan: "#06b6d4",
        },
        risk: {
          high: "#ef4444",
          medium: "#f59e0b",
          low: "#10b981",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.05)",
          hover: "rgba(255,255,255,0.08)",
          border: "rgba(255,255,255,0.10)",
        },
        dark: {
          900: "#0a0f1e",
          800: "#0d1b2a",
          700: "#0f2336",
          600: "#162840",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      backdropBlur: {
        xs: "4px",
        glass: "20px",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        float1: "float1 22s ease-in-out infinite alternate",
        float2: "float2 28s ease-in-out infinite alternate",
        float3: "float3 24s ease-in-out infinite alternate",
        pulse2: "pulse2 2s cubic-bezier(0.4,0,0.6,1) infinite",
        orb: "orbFloat 20s ease-in-out infinite alternate",
        "pulse-dot": "pulseDot 2s infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float1: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(30px,-40px) scale(1.05)" },
          "100%": { transform: "translate(-15px,20px) scale(0.97)" },
        },
        float2: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-25px,35px) scale(1.03)" },
          "100%": { transform: "translate(20px,-15px) scale(0.98)" },
        },
        float3: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(20px,-30px) scale(1.04)" },
          "100%": { transform: "translate(-10px,25px) scale(0.96)" },
        },
        pulse2: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        orbFloat: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(30px,-40px) scale(1.05)" },
          "66%": { transform: "translate(-20px,30px) scale(0.97)" },
          "100%": { transform: "translate(15px,-20px) scale(1.02)" },
        },
        pulseDot: {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.4)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glass-lg": "0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)",
        "glow-blue": "0 0 30px rgba(59,130,246,0.25)",
        "glow-red": "0 0 30px rgba(239,68,68,0.20)",
        "glow-green": "0 0 30px rgba(16,185,129,0.20)",
        "glow-amber": "0 0 30px rgba(245,158,11,0.20)",
      },
      borderRadius: {
        glass: "16px",
      },
    },
  },
  plugins: [],
}
