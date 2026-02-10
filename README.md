# SuccessMaker Solver

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://easybridge-dashboard-web.savvaseasybridge.com/assets/navbarAssets/successmaker_logo.svg">
        <img alt="SuccessMaker" src="https://easybridge-dashboard-web.savvaseasybridge.com/assets/navbarAssets/successmaker_logo.svg" width="50%">
    </picture>
</p>

<h3 align="center">
Automated SuccessMaker problem solver using AI vision and Tamper Monkey.
</h3>

## Features

-  problem solving using Ollama
-  Automatic screenshot capture and analysis
-  Auto-input answers into SuccessMaker
-  Auto-clicking "Done" button (full automation)
-  Fully local (no data sent to external APIs)

## Installation Guide

### Install Ollama (Required for Both)

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**macOS:**
Download from https://ollama.ai (DMG installer available)

**Windows:**
Download from https://ollama.ai (Windows executable available)

**Then download the vision model (one-time):**
```bash
ollama pull llava
```

**Start Ollama (keep running in background):**
```bash
ollama serve
```

You should see:
```
Listening on 127.0.0.1:11434
```

## Setup Options

### Option 1: Tamper Monkey (Recommended for automation)

**Requirements:**
- Ollama installed and running (`ollama serve`)
- Chrome, Firefox, or any browser with Tamper Monkey extension
- Tamper Monkey browser extension: https://www.tampermonkey.net/

**Steps:**
1. Install Tamper Monkey extension for your browser
2. Click the Tamper Monkey icon → "Create a new script"
3. Copy the entire contents of `tampermonkey_script.js`
4. Paste into the script editor
5. Press `Ctrl+S` to save
6. Visit SuccessMaker - the green "Solve!" button appears automatically

### Option 2: Chrome DevTools Console (No extensions needed)

**Requirements:**
- Ollama installed and running (`ollama serve`)
- Chrome browser (or any Chromium-based browser)

**Steps:**
1. Open SuccessMaker in Chrome
2. Press `F12` to open DevTools
3. Click the **Console** tab
4. Copy and paste the entire contents of `chrome_console_script.js`
5. Press Enter
6. Green "Solve!" button appears instantly!

**You can run this every time you open SuccessMaker - no installation needed!**

## Files

- `tampermonkey_script.js` - Tamper Monkey userscript (automatic injection)
- `chrome_console_script.js` - Standalone script for Chrome console (manual injection)