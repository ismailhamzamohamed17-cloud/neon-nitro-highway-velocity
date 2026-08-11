# 🏎️ Neon Nitro: Highway Velocity

An action-packed 3D perspective retro-arcade highway racer built with React 19, TypeScript, Vite, Tailwind CSS, and HTML5 Canvas with procedural Web Audio sound synthesis.

---

## 🚀 Quick Start (Run Locally)

Follow these simple steps to run the project on your computer:

### Prerequisites
- [Node.js](https://nodejs.org/) (Version **18** or **20+** recommended)
- `npm` (comes bundled with Node.js)

### Steps

1. **Clone or Extract the Repo:**
   ```bash
   git clone https://github.com/your-username/neon-nitro-highway-velocity.git
   cd neon-nitro-highway-velocity
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🌐 Deploy to GitHub Pages (Automatic Workflow)

This repository includes a pre-configured GitHub Action (`.github/workflows/deploy.yml`) that automatically builds and deploys your game to **GitHub Pages** whenever you push code!

### Setup GitHub Pages in 3 Steps:

1. Push your project to GitHub repository `neon-nitro-highway-velocity`:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Neon Nitro Highway Velocity"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/neon-nitro-highway-velocity.git
   git push -u origin main
   ```

2. On GitHub, go to your repository **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.

That's it! GitHub will build and host your game live at:
`https://YOUR_GITHUB_USERNAME.github.io/neon-nitro-highway-velocity/`

---

## 🛠️ Available Scripts

- `npm run dev` - Starts local Vite development server
- `npm run build` - Compiles TypeScript and builds production distribution in `/dist`
- `npm run preview` - Previews the production build locally
- `npm run lint` - Runs TypeScript type checks

---

## 🌟 Game Features

- **28 Chapter Progression Campaign**: Dynamic environments (Pine Forest, Cyberpunk City, Sunset Coast, Sakura Pass, Snow Blizzard)
- **Tuning Garage**: Customize 4 distinct car body classes (Sports, Muscle, Super, Hyper), neon underglow, paint finishes, and rear wings
- **Dynamic Physics & Visuals**: Smooth lane shifting, steering tilt, wind-swaying trees, wet tarmac reflections, edge road lamps, and flying birds/drones
- **Procedural Synthesizer**: Engine revs, turbo whistle, nitro boost, brake squeals, and dynamic synth music tracks generated via Web Audio API

---

## 💡 Troubleshooting Common GitHub Issues

- **Blank Screen on GitHub Pages?**
  - Resolved! `vite.config.ts` uses relative paths (`base: './'`), so all built scripts and assets resolve correctly on GitHub Pages subpaths.
- **`npm install` errors?**
  - Ensure you are using Node.js v18 or v20+. Run `node -v` to check your version.
