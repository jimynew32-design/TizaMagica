/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // === Dark Luxe Surfaces (Poseify) ===
                background: '#0D0D0D',
                'surface-card': '#1A1A1A',
                'surface-header': '#242424',
                'surface-active': '#2E2E2E',
                // === Primary Accent (Hot Pink) ===
                'primary-teal': '#E41779',
                'brand-magenta': '#FF2D8A',
                // === Semantic ===
                'heat-positive': '#4ade80',
                'heat-neutral': '#fbbf24',
                'heat-negative': '#f87171',
            },
            fontFamily: {
                heading: ['Josefin Sans', 'sans-serif'],
                sans: ['Work Sans', 'system-ui', '-apple-system', 'sans-serif'],
            },
            borderRadius: {
                '2.5xl': '1.25rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            boxShadow: {
                'glow-teal': '0 0 20px rgba(228, 23, 121, 0.3)',
                'glow-magenta': '0 0 20px rgba(255, 45, 138, 0.3)',
                'soft': '0 4px 24px rgba(0, 0, 0, 0.15)',
            },
            transitionTimingFunction: {
                'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'pulse-glow': 'pulseGlow 2s infinite',
                'focus-bounce': 'focusBounce 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                'entrance': 'entrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 10px rgba(228, 23, 121, 0.2)' },
                    '50%': { boxShadow: '0 0 25px rgba(228, 23, 121, 0.4)' },
                },
                focusBounce: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.02)' },
                },
                entrance: {
                    '0%': { opacity: '0', transform: 'scale(0.98)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                }
            },
        },
    },
    plugins: [],
}
