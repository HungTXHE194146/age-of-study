# Development Server - IMPORTANT

## ⚠️ ALWAYS START FROM THIS DIRECTORY

This project MUST be run from: `age-of-study/age-of-study/`

## Quick Start (Recommended)

**Windows:**
```bash
# Just double-click or run:
dev.bat
```

**Manual start:**
```bash
cd age-of-study/age-of-study
npm run dev
```

## ❌ Common Mistakes

**DON'T run from parent directory:**
```bash
# ❌ WRONG - This will cause "Can't resolve 'tailwindcss'" error
cd age-of-study  # (parent directory)
npm run dev
```

## 🔧 Troubleshooting

If you see `Error: Can't resolve 'tailwindcss'`:

1. **Kill all Node processes:**
   ```bash
   taskkill /F /IM node.exe
   ```

2. **Clear cache:**
   ```bash
   cd age-of-study/age-of-study
   rmdir /s /q .next
   ```

3. **Start again:**
   ```bash
   npm run dev
   ```

## 📁 Correct Directory Structure

```
age-of-study/              ← DON'T run from here
├── age-of-study/          ← RUN FROM HERE ✓
│   ├── package.json       ← This is where npm should run
│   ├── dev.bat            ← Or use this script
│   ├── app/
│   ├── src/
│   └── ...
├── README.md
└── database.sql
```

## Why This Happens

- Node.js resolves modules relative to where `npm run dev` is executed
- If run from wrong directory, it can't find `node_modules/tailwindcss`
- Cache (`.next`) stores incorrect paths and persists across restarts
