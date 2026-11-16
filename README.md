# NSE annual report data

Open dataset extracted from public annual reports of NSE-listed companies, with a small static website to browse it.

- **Financial statements** for 1,270 companies, fiscal years FY2008-09 to FY2025-26 (balance sheet, profit and loss, cash flow; banks, NBFCs and insurers have sector fields). Amounts are in ₹ crore.
- **BRSR tables** (Business Responsibility and Sustainability Report) for 1,234 companies, FY2022-23 to FY2025-26.

Site pages: `index.html` (search), `company.html` (one company: financials and BRSR tables), `compare.html` (several companies over several years, with chart and CSV export), `downloads.html`, `about.html` (method and data quality).

## Layout
- `data/companies.json` – company index
- `data/f/SYMBOL.json` – financials per company (key metrics and all fields by year, with flagged years)
- `data/c/SYMBOL.json` – BRSR tables per company, year and section (rows carry quality markers)
- `downloads/` – gzip CSV files: tidy financial panel, wide financial files, BRSR tables by section
- `common.js`, `style.css` – shared code and styles (no build step, no dependencies)

## Quality
Extraction is automatic. About 7% of company-year financial records fail plausibility checks and are flagged (hidden by default on the site). In a PDF spot-check, 96.7% of sampled core values (94.8% NBFC, 83.5% bank) were found on the statement page; a match does not prove the unit is right. BRSR figures agree with the next report's prior-year column in 90.6% of 114,760 comparable cells. See `about.html` for limitations, in particular for banks in earlier years.

## Licence
Data: CC BY 4.0. Code: MIT. The underlying reports remain the property of the companies that published them. No warranty is given for accuracy.
