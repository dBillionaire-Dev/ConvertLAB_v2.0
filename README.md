# ConvertLAB v2.0

ConvertLAB is a progresive web application for converting various medical, laboratory, and health-related units, including BMI, LDL, chemical units, temperature, weight, and more. This version (v2.0) features a modern frontend built with Next.js, TypeScript, and Tailwind CSS, designed for a smooth, responsive user experience.

---

## Live Demo

[ConvertLAB v2.0 Live](https://convertlab-nex.vercel.app/)

---

## Tech Stack

- **Next.js** (App Router) — for page routing, server rendering where needed, and fast frontend performance  
- **TypeScript** — static typing for safer, more maintainable code  
- **Tailwind CSS** — utility-first CSS for rapid UI development and consistent design  
- **React hooks / client-side state** — for form handling, conversion logic, and interactive components  
- **GitHub + Vercel** — version control and deployment  

---

## Features

- Unit conversion for various lab/health metrics (e.g. chemical, weight, temperature, LDL, BMI)  
- Responsive layout — mobile & desktop friendly  
- Real-time input validation and conversion feedback  
- Modular component architecture (conversion cards, input fields, selection controls)  
- Clean, user-friendly UI  

---

## Project Structure

```

/app                   ── Next.js pages/components (routes, layout, etc.)
/components            ── Reusable React components (cards, inputs, buttons, etc.)
/hooks                 ── Custom React hooks for state & logic
/lib                   ── Utility functions (conversion algorithms, helpers)
/public                ── Static assets (images, icons, etc.)
/styles                ── Global and Tailwind config/style overrides
next.config.mjs        ── Next.js configuration
tailwind.config.ts     ── Tailwind configuration
tsconfig.json          ── TypeScript configuration

````

---

## Installation & Setup

```bash
git clone https://github.com/dBillionaire-Dev/ConvertLAB_v2.0.git
cd ConvertLAB_v2.0
# Use npm or your preferred package manager
npm install
# or
yarn install
# or
pnpm install

# Run in development mode
npm run dev
# or
yarn dev
# or
pnpm dev
````

Visit `http://localhost:3000` (or whatever port your setup uses) to view.

---

## How to Use

1. From the home page, select the conversion or calculator tool you want (e.g. BMI, temperature, chemical units, etc.).
2. Input the value(s) to convert.
3. View the result immediately after input, with real-time feedback or validation.

---

## Future Improvements (Ideas)

* Add theme toggle (dark/light mode)
* Add more unit types (e.g. more chemical units, more complex lab metrics)
* Improve accessibility (keyboard navigation, screen reader support)
* Add localization/multi-language support
* Unit tests / integration tests for conversion logic

---

## Author

**dBillionaire-Dev**

---

## Contact

For issues or feature requests, open a GitHub issue in this repo or contact me via email / social profile

## Anonymous Usage Analytics

ConvertLAB can record successful calculator usage without requiring users to register. Each browser gets an anonymous installation ID, and calculation events are first placed in an IndexedDB outbox so usage is retained while offline. When connectivity returns, pending events are uploaded to the Next.js analytics API and stored in Supabase.

### Setup

1. Create a Supabase project.
2. Run `supabase/analytics.sql` in the Supabase SQL Editor.
3. Add the variables from `.env.example` to your local environment and Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET` (at least 32 characters)
4. Open `/admin` and sign in with `ADMIN_PASSWORD`.

The implementation records tool metadata and timestamps, not calculator input values or patient identifiers.

Offline events remain in the browser's IndexedDB until the server confirms receipt. The analytics API is intentionally outside the calculator's critical path, so a failed network request never prevents a calculation from working.

### Analytics console

`/admin` provides total calculations, today's usage, seven-day usage, offline-synced calculations, top calculators, category usage, and a 14-day usage chart.

### Existing history backfill

When analytics is first enabled, ConvertLAB performs a one-time migration of calculation history that is still present in the user's local IndexedDB. Historical entries are queued using their existing history IDs, so an interrupted migration can safely retry without double-counting. Only calculator metadata and timestamps are sent; existing calculation inputs and results remain local. Historical entries are labelled separately in the admin console as **Historical backlog**.

## Anonymous Usage Analytics

ConvertLAB can record calculator usage without requiring users to register. Events are queued locally in IndexedDB first, so calculations made offline can sync later when connectivity returns. The `/admin` management console shows aggregate usage across the deployed application.

Analytics can distinguish:
- `web` — normal browser usage
- `pwa` — installed/standalone PWA usage
- deployment `environment` — configured with `NEXT_PUBLIC_APP_ENV`
- `appVersion` — application version recorded by the tracker
- historical backlog — calculations imported once from an existing user's local History

The analytics implementation does not send calculator inputs or results. Run `supabase/analytics.sql` in Supabase before enabling the server-side analytics API.
