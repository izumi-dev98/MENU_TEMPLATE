# Menu Template — IPD Meal Plan & Staff Menu Plan

A mobile-friendly weekly meal planner. Manage two menu tables
(**Daily Menu** and **Menu Set**), restyle them with 11 designs × 6 layouts,
and download any table as a PNG image. All data persists in `localStorage`.

Live demo: `https://menu-template-drab.vercel.app` (Vercel)

## Features

- **Two menu views** (tab switcher)
  - 🍽️ Daily Menu — Day / Breakfast / Lunch / Dinner
  - 👥 Menu Set — Day / Dish / Price (MMK format)
- **Popup forms** — add / edit entries, rename the table title from the form
- **Smart table** — optional Lunch/Dinner columns auto-hide when empty
- **11 table designs** — Classic Gold, Dark Elegant, Fresh Green, Ocean Blue,
  Lacquer Red, Royal Purple, Teal Fresh, Sunset Orange, Sakura Pink,
  Steel Navy, Coffee Brown
- **6 layouts** — Classic Table, Card View, Minimal List, Compact,
  Pill Rows, Magazine
- **PNG export** — desktop exports a 920px table; mobile exports a
  phone-size card image with full data
- **Popup alerts** — all notices and the delete confirmation are modals
- **Mobile responsive** — tables stack into labeled cards under 640px
- **localStorage persistence** — separate keys per view, theme, layout and titles

## Tech

- React 19 + Vite
- `html-to-image` for PNG export (no other runtime deps)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the build
```

## Project structure

```
src/
  App.jsx        # all views, forms, popups, export logic
  App.css        # themes, layouts, responsive rules
  index.css      # base page styles
  main.jsx       # React entry
```

## Notes

- Edit buttons (✎ / ×) are hidden automatically during PNG export.
- Design + layout choices are saved and applied to both tables.
