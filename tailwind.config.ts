import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#77BF56',
        'brand-green-dark': '#5da140',
        'brand-green-light': '#90d172',
      },
      backgroundImage: {
        'mesh-dark': 'radial-gradient(at 40% 20%, hsla(100,30%,15%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(100,50%,10%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(110,40%,12%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(100,20%,8%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(100,40%,10%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(100,50%,15%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(100,20%,5%,1) 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
}
export default config