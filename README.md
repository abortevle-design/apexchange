# Apex exchange bank — Online Banking UI (Demo)

A frontend-only, German-inspired online banking portal built for portfolio / UI-UX demonstration purposes.

**No backend, no authentication, no real banking functionality — everything is mock data.**

## Tech stack

- React 19 + Vite
- Tailwind CSS
- React Router
- Framer Motion
- Lucide React icons
- react-i18next (English / German)
- Recharts

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. The login page accepts anything — just press "Sign in securely" to enter the dashboard.

## Editing the mock data

All banking data lives in plain JSON files under `src/data/`, so you can edit it without touching any React code:

- `transactions.json` — 130 generated transactions (id, date, time, description, merchant, sender, receiver, reference, category, amount, currency, balance after, type, status, payment method, location)
- `accounts.json` — checking / savings / investment / business accounts
- `cards.json` — debit & credit cards
- `savingsGoals.json` — savings goals and progress
- `investments.json` — portfolio, allocation, performance, holdings
- `loans.json` — mortgage, car, personal, student loans
- `notifications.json` — notification center items
- `beneficiaries.json` — recent transfer recipients

To regenerate a fresh batch of 130 realistic transactions, run:

```bash
node gen_transactions.cjs
```

(Edit the `merchants` array in that script to add your own transaction types/merchants.)

## Translations

`src/i18n/en.json` and `src/i18n/de.json` contain every string in the app, keyed by page/section. Add a new language by copying one of these files and registering it in `src/i18n/index.js`.

## Structure

```
src/
  components/   reusable UI (Sidebar, Navbar, StatCard, TransactionModal, ...)
  layouts/      AppLayout (sidebar + navbar + page outlet)
  pages/        one file per route
  data/         editable JSON mock data
  i18n/         translations
  context/      theme (light/dark) provider
```

## Notes

- Login always navigates straight to /dashboard — there is no real authentication.
- "Download statement", "Export PDF", "Freeze card", "Pay now" etc. are UI-only interactions with no real backend.
- Dark mode and language preference persist in localStorage.
