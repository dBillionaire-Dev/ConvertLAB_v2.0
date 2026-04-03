# ConvertLAB v2.0

ConvertLAB is a progresive web application for converting various medical, laboratory, and health-related units, including BMI, LDL, chemical units, temperature, weight, and more. This version (v2.0) features a modern frontend built with Next.js, TypeScript, and Tailwind CSS, designed for a smooth, responsive user experience.

---

## Live Demo

[ConvertLAB v2.0 Live](https://convertlab-eta.vercel.app/)

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
