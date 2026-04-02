# Typing Game (たいぴんぐ げーむ)

## Overview
A typing game for a 5-year-old girl. Admin uploads character images with words. The child types letters to gradually reveal the image with magical effects. UI is in Japanese hiragana.

## Tech Stack
- Language/Framework: Next.js 16 (App Router) + TypeScript
- Styling: Tailwind CSS with pastel theme
- Rendering: HTML5 Canvas API for image reveal effects
- Audio: Howler.js
- AI: Gemini 3 Pro for UI image generation
- Storage: JSON file (data/games.json) + filesystem (public/uploads/)
- Deployment: Cloud Run (asia-northeast1)

## Commands
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`

## Environment Variables
- GEMINI_API_KEY: Google Gemini API key

## Conventions
- All UI text in Japanese hiragana (centralized in ui-text.ts)
- Font: M PLUS Rounded 1c
- Pastel color palette (pink, blue, lavender, mint, yellow)
- Canvas API for all image reveal effects
- No database - JSON file storage for MVP
- Touch targets >= 48px for iPad support
- Next.js 16: params must be awaited in routes/pages

## Known Issues & Solutions
(none yet)
