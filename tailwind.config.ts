const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/sections/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	screens: {
  		sm: '640px',
  		md: '768px',
  		lg: '1200px'
  	},
  	extend: {
  		fontFamily: {
  			// heading: [
  			// 	'var(--font-sora)',
  			// 	'sans-serif'
  			// ],
  			// body: [
  			// 	'var(--font-space-grotesk)',
  			// 	'sans-serif'
  			// ]
			poppins: ['Poppins'], // Custom font

  		},
  		container: {
  			center: true,
  			padding: {
  				DEFAULT: '1rem',
  				lg: '2rem'
  			}
  		},
  		gap: {
  			'18': '4.5rem'
  		},
  		inset: {
  			'18': '4.5rem'
  		},
  		height: {
  			'18': '4.5rem'
  		},
  		padding: {
  			'18': '4.5rem'
  		},
  		rotate: {
  			'135': '135deg',
  			'225': '225deg',
  			'270': '270deg',
  			'315': '315deg'
  		},
  		keyframes: {
  			'cursor-blink': {
  				'0%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
			  shimmer: {
				"0%": { transform: "translateX(-100%)" },
          		"100%": { transform: "translateX(100%)" },
			},
  		},
  		animation: {
  			'cursor-blink': 'cursor-blink 1s step-start infinite',
			shimmer: "shimmer 2s linear infinite",
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [
    addVariablesForColors,
      require("tailwindcss-animate")
],
};

function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );
 
  addBase({
    ":root": newVars,
  });
}

