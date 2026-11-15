# NSE annual report data

Tables extracted from the BRSR (Business Responsibility and Sustainability Report) section of annual reports of NSE-listed companies, reporting years 2022-23 to 2025-26.

- `index.html` – company search; `company.html` – tables per company, year and section
- `data/` – one JSON file per company (`data/c/SYMBOL.json`) and the company index
- `downloads/` – raw extracted tables as gzip-compressed CSV, one file per section

## Caveats
Extraction is automatic. Tables can contain split, merged, shifted or missing rows and, for some layouts, text from neighbouring columns or pages. Check anything important against the original report. Financial statement data is not included yet.

## Licence
Data: CC BY 4.0. Code: MIT. The underlying reports remain the property of the companies that published them. No warranty is given for accuracy.
