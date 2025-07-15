# FitCircle - GitHub Pages Deployment Guide

## Quick Setup Instructions

### 1. Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in (create account if needed)
2. Click "New Repository" (green button)
3. Name it: `fitcircle` (or any name you prefer)
4. Make it **Public** (required for free GitHub Pages)
5. Check "Add a README file"
6. Click "Create repository"

### 2. Upload Your Files
You have two options:

#### Option A: Web Upload (Easiest)
1. Click "uploading an existing file" link on your new repository page
2. Drag and drop these files from your Replit project:
   - All files from the `client/` folder
   - The `package.github.json` file (rename to `package.json`)
   - The `vite.config.github.ts` file (rename to `vite.config.ts`)
   - The `.github/workflows/deploy.yml` file
3. Commit the files

#### Option B: Git Commands (if you know Git)
```bash
git clone https://github.com/yourusername/fitcircle.git
# Copy files to the cloned directory
git add .
git commit -m "Initial FitCircle app"
git push origin main
```

### 3. Enable GitHub Pages
1. Go to your repository Settings tab
2. Scroll down to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The deployment will start automatically

### 4. Access Your App
- Your app will be live at: `https://yourusername.github.io/fitcircle/`
- First deployment takes 2-5 minutes
- Check the "Actions" tab to see deployment progress

## Files to Upload

### Required Files:
- `client/index.html`
- `client/src/` (entire folder)
- `package.github.json` → rename to `package.json`
- `vite.config.github.ts` → rename to `vite.config.ts`
- `.github/workflows/deploy.yml`

### Important Notes:
- Update the `base` field in `vite.config.ts` to match your repository name
- If your repo is named something other than "fitcircle", change `/fitcircle/` to `/your-repo-name/`

## Updating Your App
1. Make changes in Replit
2. Upload new files to GitHub (replace old ones)
3. App updates automatically within minutes

Your FitCircle app will work exactly the same as in Replit, with all localStorage functionality intact!