\# DukaanIQ: Kirana Inventory \& Food-Waste Monitor



A client-side web app for Indian kirana stores that tracks inventory, flags expiring stock, and forecasts demand so shopkeepers can reorder the right quantity at the right time.



\## Features



\*\*Stage 1: Inventory engine\*\*

\- Live stock counts for 18 sample kirana products

\- Valuation at wholesale cost and retail value, with margin %

\- Expiry tracking (expired, expiring within 15 days, shelf life remaining)

\- Low-stock alerts and operational alert banners

\- Add, edit and delete products



\*\*Stage 2: Demand intelligence\*\*

\- Sales ledger with Record Sale and CSV import

\- 7-day demand forecast using day-of-week seasonal smoothing

\- Chronological train/test split (no future data leakage)

\- Comparison against a 7-day moving-average baseline using MAE, RMSE and WAPE

\- Reorder recommendation: `max(0, lead time demand + safety stock - current stock)`, with adjustable lead time and safety days



\## Tech stack

React 19, TypeScript, Vite, Tailwind CSS. All forecasting runs in the browser, with no backend.


```
## Run locally



Requires Node.js.



&#x20;   npm install

&#x20;   npm run dev

```

Then open http://localhost:3000.


```
\## Tests



&#x20;   npm test

```

Runs 80 automated checks covering forecasting, error metrics, reorder logic and CSV validation.



\## Sales CSV format



Headers: `date` (YYYY-MM-DD), `product` (name or ID), `quantity`, and optional `unit\\\_price`. An example file can be downloaded from the import dialog.



\## Note on data

The 445 demo sales transactions are synthetic and are labeled as such in the app. They exist only to demonstrate and test the forecasting engine.

