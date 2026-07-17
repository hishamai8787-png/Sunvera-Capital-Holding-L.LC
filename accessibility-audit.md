# Sunvera Capital — Accessibility Audit (Phase 3)
**Date:** 2026-07-17
**Standard:** WCAG 2.1 Level AA
**Auditor:** Elara (AI Agent)

## Summary

Audited all 7 pages, 2 error pages, and 4 key components. Found **23 accessibility issues** across 4 severity levels.

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 4 | Block assistive technology entirely |
| High | 7 | Significant barriers for screen reader users |
| Medium | 8 | Usability issues for some users |
| Low | 4 | Minor improvements |

---

## Critical Issues

### C-A1: No skip-to-content link
**Location:** `app/layout.tsx`
**WCAG:** 2.4.1 Bypass Blocks (Level A)
**Issue:** No skip link to bypass the repeated header navigation. Keyboard users must tab through all nav links on every page.
**Fix:** Add a visually-hidden skip link at the top of the body.

### C-A2: TickerSearch has no ARIA combobox semantics
**Location:** `components/TickerSearch.tsx`
**WCAG:** 4.1.2 Name, Role, Value (Level A)
**Issue:** The autocomplete dropdown has no `role="combobox"`, `aria-expanded`, `aria-controls`, or `aria-activedescendant`. Screen reader users can't tell there's a dropdown or which item is active.
**Fix:** Add full ARIA combobox pattern.

### C-A3: Form inputs lack associated labels in credit page
**Location:** `app/credit/[symbol]/page.tsx`
**WCAG:** 1.3.1 Info and Relationships (Level A), 3.3.2 Labels or Instructions (Level A)
**Issue:** The facility parameter form uses `<label>` elements but doesn't associate them with inputs via `htmlFor`/`id`. Screen readers won't announce the label when focusing the input.
**Fix:** Add `id` to each input and `htmlFor` to each label.

### C-A4: Images have empty alt text
**Location:** `app/analyze/[symbol]/page.tsx`, `app/credit/[symbol]/page.tsx`
**WCAG:** 1.1.1 Non-text Content (Level A)
**Issue:** Company logo images have `alt=""` which hides them from screen readers entirely. The company name is in the heading, so decorative alt is acceptable, BUT the images should have `role="img"` and `aria-label` if they convey information.
**Fix:** Use `alt={`${profile.companyName} logo`}` since the logo is informative.

---

## High Issues

### H-A1: Tables lack scope attributes on headers
**Location:** `app/scanner/page.tsx`, `app/playbooks/page.tsx`, `app/credit/[symbol]/page.tsx`
**WCAG:** 1.3.1 Info and Relationships (Level A)
**Issue:** `<th>` elements don't have `scope="col"` or `scope="row"`. Screen readers can't properly associate cells with their headers.
**Fix:** Add `scope="col"` to column headers, `scope="row"` to row headers.

### H-A2: Watchlist table has no header row
**Location:** `components/Watchlist.tsx`
**WCAG:** 1.3.1 Info and Relationships (Level A)
**Issue:** The watchlist table has no `<thead>` with column headers. Screen reader users can't tell what each column represents.
**Fix:** Add a `<thead>` with scoped headers (Symbol, Price, Change, Actions).

### H-A3: TradingView widgets lack accessible titles
**Location:** `app/markets/page.tsx`
**WCAG:** 2.4.4 Link Purpose / 4.1.2 Name, Role, Value
**Issue:** TradingView widgets render as iframes without `title` attributes. Screen readers announce "iframe" with no context.
**Fix:** Wrap each widget in a `<section>` with an `aria-label` or visible heading.

### H-A4: Emoji used as icons without aria-hidden
**Location:** Multiple pages (`app/page.tsx`, `app/markets/page.tsx`, `app/scanner/page.tsx`, etc.)
**WCAG:** 1.1.1 Non-text Content
**Issue:** Emoji like 📊, 📈, 🔎 are rendered as text. Screen readers announce them literally ("bar chart emoji"). Should be decorative.
**Fix:** Wrap emoji in `<span aria-hidden="true">` when decorative.

### H-A5: Login error message not in aria-live region
**Location:** `app/login/page.tsx`
**WCAG:** 4.1.3 Status Messages (Level AA)
**Issue:** Error messages appear but are not in an `aria-live` region. Screen reader users won't know an error appeared.
**Fix:** Add `aria-live="polite"` to the error container.

### H-A6: Dynamic price updates not announced
**Location:** `components/Watchlist.tsx`
**WCAG:** 4.1.3 Status Messages (Level AA)
**Issue:** Live price updates in the watchlist are not announced to screen reader users.
**Fix:** Add `aria-live="off"` on the table (too noisy for polite) and an `aria-label` on the section indicating it's live data.

### H-A7: Analyze page error state missing role="alert"
**Location:** `app/analyze/[symbol]/page.tsx`
**WCAG:** 4.1.3 Status Messages (Level AA)
**Issue:** Error state rendered as a div but not marked as `role="alert"`.
**Fix:** Add `role="alert"` to the error container.

---

## Medium Issues

### M-A1: Color contrast below 4.5:1 for small text
**Location:** Multiple pages
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA)
**Issue:** `text-slate-600` on `bg-slate-950` = ~3.5:1 contrast ratio. Fails for small text.
**Fix:** Use `text-slate-400` (minimum) for text smaller than 18px.

### M-A2: Focus indicators inconsistent
**Location:** Multiple components
**WCAG:** 2.4.7 Focus Visible (Level AA)
**Issue:** Some interactive elements (links in tables, nav icons) don't have visible focus indicators. The CSS has `:focus-visible` but components rely on Tailwind's focus classes which sometimes don't show.
**Fix:** Ensure all interactive elements have visible focus styles.

### M-A3: Interactive elements too small on mobile
**Location:** `components/Watchlist.tsx`
**WCAG:** 2.5.5 Target Size (Level AAA — best practice)
**Issue:** The remove (✕) button is very small and only appears on hover. Not usable on touch devices.
**Fix:** Make button always visible on mobile, increase touch target to 44x44px.

### M-A4: Page title not updated on dynamic navigation
**Location:** `app/analyze/[symbol]/page.tsx`, `app/credit/[symbol]/page.tsx`
**WCAG:** 2.4.2 Page Titled (Level A)
**Issue:** Analyze page has no `metadata` export with title. Credit page same.
**Fix:** Add `export const metadata` with dynamic title.

### M-A5: No lang attribute on dynamic content
**Location:** N/A
**WCAG:** 3.1.2 Language of Parts (Level AA)
**Issue:** No issues found — English content only.

### M-A6: Loading states not announced
**Location:** `app/analyze/[symbol]/loading.tsx`, `app/credit/[symbol]/loading.tsx`
**WCAG:** 4.1.3 Status Messages (Level AA)
**Issue:** Loading states appear without `aria-live` announcement.
**Fix:** Add `role="status"` and `aria-live="polite"` to loading containers.

### M-A7: Scanner empty state heading level
**Location:** `app/scanner/page.tsx`
**WCAG:** 1.3.1 Info and Relationships
**Issue:** Empty state uses `<h2>` but it's the first heading after h1. OK but should be consistent.
**Fix:** Already correct, just documenting.

### M-A8: Form submission feedback missing
**Location:** `app/login/page.tsx`
**WCAG:** 3.3.1 Error Identification (Level A)
**Issue:** Loading state ("Signing in...") is text change, not aria-live.
**Fix:** Add `aria-busy` on the submit button during loading.

---

## Low Issues

### L-A1: Abbreviations not expanded
**Location:** Multiple pages
**WCAG:** 3.1.4 Abbreviations (Level AAA)
**Issue:** Terms like "P&L", "DSCR", "EBITDA" used without first expansion.
**Fix:** Add `<abbr title="...">` for first use on each page.

### L-A2: Print stylesheet improvements
**Location:** `app/globals.css`
**WCAG:** 1.4.10 Reflow (Level AA)
**Issue:** Print styles exist but don't handle large tables well.
**Fix:** Add `@page` margins and table reflow for print.

### L-A3: Heading order in module cards
**Location:** `app/page.tsx`
**WCAG:** 1.3.1 Info and Relationships
**Issue:** Module cards use `<h2>` inside links. This is technically valid but heading order could be clearer.
**Fix:** Acceptable as-is for now.

### L-A4: Missing description meta tags
**Location:** Multiple pages
**WCAG:** Not a WCAG requirement but best practice
**Issue:** Only layout has description meta. Individual pages lack descriptions.
**Fix:** Add page-specific descriptions in metadata exports.

---

## Fix Priority Order

1. C-A1: Skip-to-content link (layout)
2. C-A2: TickerSearch ARIA combobox
3. C-A3: Credit form labels
4. C-A4: Image alt text
5. H-A1: Table scope attributes (all tables)
6. H-A4: Emoji aria-hidden (all pages)
7. H-A5: Login aria-live
8. H-A7: Error role=alert
9. M-A1: Color contrast fixes
10. M-A4: Page titles
11. M-A6: Loading aria-live
12. Remaining low/medium items
