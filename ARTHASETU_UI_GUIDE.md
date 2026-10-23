# ArthaSetu — Token-Driven UI Design System & Implementation Guidance

> **Version:** 1.0.0  
> **Target Surface:** Web Application (Desktop, Tablet, Mobile)  
> **Brand & Target:** ArthaSetu (`https://arthasetu-mocha.vercel.app/stats`)  
> **Audience:** Registered users, product customers, and Indian gig workers  
> **Tone & Style:** Functional, compact, data-dense, and accessible  
> **Compliance Target:** WCAG 2.2 Level AA  

---

## 1. Context and Goals

### 1.1 One-Sentence Design Intent
ArthaSetu's design intent is to provide gig workers and registered product customers with a compact, data-dense, functional, and WCAG 2.2 AA-compliant financial intelligence interface that delivers rapid clarity across cashflow, expenses, tax obligations, and savings.

### 1.2 Core Objectives
- **Data Density with Visual Discipline:** Interfaces must present multi-platform earnings, variable expenses, tax withholdings, and buffer health in a concise layout without visual clutter.
- **Strict Token Governance:** Every pixel must trace back to the token registry. Hardcoded hex colors, arbitrary spacing increments, or bespoke border radii must not be introduced into production code.
- **Uncompromised Accessibility (WCAG 2.2 AA):** All interactive elements must support complete keyboard navigation, explicit focus visibility, screen-reader landmarks, and contrast ratios $\ge 4.5:1$ for normal text and $\ge 3:1$ for UI boundaries and icons.
- **Fast Execution & Consistency:** Standardized component rules and token mappings should accelerate engineering velocity while eliminating UI drift across views.

---

## 2. Design Tokens and Foundations

### 2.1 Color Token Registry & Semantic Mapping

All colors must be referenced using their semantic CSS custom properties or mapped Tailwind utility classes. Direct raw hex values must never be used in inline styles or component CSS.

| Token Key | Role | Hex Value | Raw RGBA | Confidence | Usage Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--color-border-1` | Border | `#E1E7EF` | `rgba(225, 231, 239, 1)` | 0.85 | Primary container border for light mode cards, dividers, and table row outlines. |
| `--color-muted-2` | Muted Text | `#1F2937` | `rgba(31, 41, 55, 1)` | 0.80 | Primary text color in light theme; high-contrast dark slate (`slate-800`). |
| `--color-background-3` | Background | `#000000` | `rgba(0, 0, 0, 1)` | 0.80 | High-contrast dark backgrounds, brand badges, and primary action buttons. |
| `--color-primary-4` | Primary / Slate | `#65758B` | `rgba(101, 117, 139, 1)` | 0.60 | Secondary copy, subtle labels, inactive icons, and helper text (`slate-500`). |
| `--color-border-5` | Border | `#F1F5F9CC` | `rgba(241, 245, 249, 0.8)` | 0.85 | Subtle internal dividers and card-to-card separators. |
| `--color-border-6` | Border | `#E1E7EF66` | `rgba(225, 231, 239, 0.4)` | 0.85 | Faint border for compact table cells and subtle hover outlines. |
| `--color-border-7` | Border | `#E2E8F0CC` | `rgba(226, 232, 240, 0.8)` | 0.85 | Header bottom border and sidebar right border delimiter. |
| `--color-surface-8` | Surface | `#FFFFFF` | `rgba(255, 255, 255, 1)` | 0.80 | Card surface, modal panels, and dropdown background in light mode. |
| `--color-primary-9` | Primary | `#64748B` | `rgba(100, 116, 139, 1)` | 0.60 | Secondary metric titles and inactive tab labels. |
| `--color-primary-10` | Primary Light | `#94A3B8` | `rgba(148, 163, 184, 1)` | 0.60 | Placeholder text and de-emphasized metadata. |
| `--color-muted-11` | Muted Dark | `#0F172A` | `rgba(15, 23, 42, 1)` | 0.80 | Main headings and bold numerical readouts in light mode (`slate-900`). |
| `--color-surface-12` | Surface App | `#F9FAFB` | `rgba(249, 250, 251, 1)` | 0.80 | Main application background and subtle sub-card backgrounds. |
| `--color-border-13` | Border Faint | `#E1E7EF4D` | `rgba(225, 231, 239, 0.3)` | 0.85 | Inset grouping borders and nested container dividers. |
| `--color-border-14` | Border Dark | `#1E293B` | `rgba(30, 41, 59, 1)` | 0.85 | Dark theme container border and high-contrast dark button outlines. |
| `--color-border-15` | Border Mid | `#E1E7EF99` | `rgba(225, 231, 239, 0.6)` | 0.85 | Form input borders and filter dropdown border. |
| `--color-border-16` | Border Solid | `#E2E8F0` | `rgba(226, 232, 240, 1)` | 0.85 | Tab rail border and button outlines (`slate-200`). |
| `--color-primary-17` | Primary Dark | `#334155` | `rgba(51, 65, 85, 1)` | 0.60 | Neutral badges, dark tags, and hover background overlays (`slate-700`). |
| `--color-border-18` | Border Slate | `#33415580` | `rgba(51, 65, 85, 0.5)` | 0.85 | Elevated floating button border and dark badge perimeter. |
| `--color-primary-19` | Primary Accent | `#059669` | `rgba(5, 150, 105, 1)` | 0.60 | Positive indicators, cash inflows, and active savings progress (`emerald-600`). |
| `--color-success-20` | Success | `#16A34A` | `rgba(22, 163, 74, 1)` | 0.90 | Positive balance indicator, verified badge, and goal targets met (`green-600`). |
| `--color-danger-21` | Danger Accent | `#E11D48` | `rgba(225, 29, 72, 1)` | 0.90 | Critical alerts, budget depletion warnings, and penalty highlights (`rose-600`). |
| `--color-danger-22` | Danger Solid | `#DC2626` | `rgba(220, 38, 38, 1)` | 0.90 | Cash outflow indicators and validation errors (`red-600`). |
| `--color-surface-23` | Surface Neutral | `#F1F5F9` | `rgba(241, 245, 249, 1)` | 0.80 | Neutral pill badges and input fill (`slate-100`). |
| `--color-surface-24` | Surface Frosted | `#F9FAFBF2`| `rgba(249, 250, 251, 0.95)` | 0.80 | Sticky header glassmorphism backing (`backdrop-blur-md`). |
| `--color-surface-25` | Surface Ghost | `#F3F5F74D`| `rgba(243, 245, 247, 0.3)` | 0.80 | Hover overlay on interactive list rows. |
| `--color-surface-26` | Surface Success | `#ECFDF5` | `rgba(236, 253, 245, 1)` | 0.80 | Success banner background and positive metric card accents (`emerald-50`). |
| `--color-surface-27` | Surface Danger | `#FFF1F2` | `rgba(255, 241, 242, 1)` | 0.80 | Warning/expense card background and tax alert containers (`rose-50`). |
| `--color-background-28` | Overlay Shadow | `#0F172A1A`| `rgba(15, 23, 42, 0.1)` | 0.80 | Floating Action Button (FAB) outer diffusion glow. |

### 2.2 Typography Style Specifications

The primary font family must be `Inter`, loaded with fallback stack `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`.

```css
:root {
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-base: 15px;
  --font-weight-base: 700;
  --font-line-height-base: 22.5px;
}
```

#### Typography Scale Tokens
- `font.size.h1`: `30px` (Line height: `36px`, Weight: `700`, Tracking: `-0.025em`) — Main Page Title (e.g. "Stats", "Dashboard")
- `font.size.h2`: `18px` (Line height: `27px`, Weight: `600`, Tracking: `-0.015em`) — Section Header / Card Category Title
- `font.size.h3`: `14px` (Line height: `21px`, Weight: `600`, Tracking: `0`) — Widget Subtitle / Chart Header
- `font.size.body-lg`: `15px` (Line height: `22.5px`, Weight: `700`) — Primary Interactive Label & Card Numbers
- `font.size.body-md`: `14px` (Line height: `20px`, Weight: `400` / `500`) — Standard Description & Table Body
- `font.size.body-sm`: `13px` (Line height: `19.5px`, Weight: `500`) — Navigation Menu Items & User Profile Pill
- `font.size.caption`: `12px` (Line height: `18px`, Weight: `500`) — Action Buttons, Pills & Trend Indicators
- `font.size.tiny`: `11px` (Line height: `16.5px`, Weight: `400`) — Micro Labels, Timestamps & Legal Disclaimers

### 2.3 Spacing System

All padding, margins, and flex/grid gaps must strictly adhere to the 11 spacing steps:

| Token Key | Dimension | Usage Guidance |
| :--- | :--- | :--- |
| `space.1` (`--space-1`) | `2px` | Icon-to-text micro gap, border stroke offset. |
| `space.2` (`--space-2`) | `4px` | Pill badge vertical padding, tight status list gaps. |
| `space.3` (`--space-3`) | `6px` | Floating button internal icon inset, compact button padding. |
| `space.4` (`--space-4`) | `8px` | Standard button padding (horizontal/vertical), list item spacing. |
| `space.5` (`--space-5`) | `10px` | Navigation item flex gap, search box internal padding. |
| `space.6` (`--space-6`) | `12px` | Card internal element margin, table horizontal cell padding. |
| `space.7` (`--space-7`) | `14px` | KPI 4-column metric card grid gap (`gap-3.5`). |
| `space.8` (`--space-8`) | `16px` | Standard card internal padding, layout container outer padding. |
| `space.9` (`--space-9`) | `20px` | Section-to-section vertical stack spacing on mobile. |
| `space.10` (`--space-10`) | `24px` | Main grid margin-top (`mt-6`), desktop section spacing. |
| `space.11` (`--space-11`) | `40px` | Page hero vertical padding, footer clearance. |

### 2.4 Corner Radius Mappings

| Token Key | Dimension | Usage Guidance |
| :--- | :--- | :--- |
| `radius.1` (`--radius-1`) | `3px` | Tiny status tags, micro scrollbar thumbs, compact toggle buttons. |
| `radius.2` (`--radius-2`) | `4px` | Navigation menu item hover targets (`rounded-[4px]`). |
| `radius.3` (`--radius-3`) | `6px` | Tooltips, code blocks, and contextual popovers. |
| `radius.4` (`--radius-4`) | `12px` | Standard buttons, input fields, and metric card headers (`rounded-xl`). |
| `radius.5` (`--radius-5`) | `16px` | Main dashboard containers, charts, and modal panels (`rounded-2xl`). |
| `radius.full` (`--radius-full`) | `9999px` | User avatar badges, pill filters, and Floating Action Buttons (FAB). |

### 2.5 Shadow Elevation System

| Token Key | Box Shadow Definition | Elevation Purpose |
| :--- | :--- | :--- |
| `shadow.1` (`--shadow-sm`) | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Standard card elevation, metric tiles, inactive buttons. |
| `shadow.2` (`--shadow-subtle`) | `0 1px 3px 0 rgba(0, 0, 0, 0.02)` | Inner card sections, light borders with subtle lift. |
| `shadow.3` (`--shadow-border`) | `0 0 1px 0 rgba(0, 0, 0, 0.1)` | Inset divider simulation on neutral backgrounds. |
| `shadow.4` (`--shadow-xl`) | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)` | Floating Action Button (FAB) and modal overlays. |
| `shadow.5` (`--shadow-lg`) | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)` | Dropdown menus, active popovers, notification drawers. |

---

## 3. Component-Level Rules & Specifications

### 3.1 Known Page Component Density Checklist
The ArthaSetu web application enforces a known component density profile across primary operational pages:
1. `Layout Container (FLEX)`: Toast & system notification host (`fixed top-0 z-[100] w-full flex-col-reverse md:max-w-[420px]`).
2. `Layout Container (FLEX)`: Root layout shell (`flex h-screen bg-background overflow-hidden`).
3. `Layout Container (FLEX)`: Brand header trigger container (`flex items-center gap-2.5`).
4. `Buttons`: Brand trigger action button (`group cursor-pointer focus:outline-none focus-visible:ring-2`).
5. `Layout Container (FLEX)`: Brand icon badge container (`w-8 h-8 rounded-lg bg-black flex items-center justify-center border border-slate-800`).
6. `Buttons`: Sidebar collapse toggle control (`w-5 h-5 rounded-[3px] border border-slate-200/60 shadow-sm`).
7. `Navigation`: Main sidebar navigation container (`nav flex-1 overflow-y-auto px-2 py-2 space-y-0.5 w-[255px]`).
8. `Layout Container (FLEX)`: Nav item item button wrapper (`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[4px]`).
9. `Buttons`: Nav item interactive button (`transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50`).
10. `Layout Container (FLEX)`: Header user profile pill container (`flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-muted/60`).
11. `Buttons`: Header user profile button (`h-auto rounded-full transition-colors`).
12. `Layout Container (FLEX)`: User avatar circle (`w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-semibold text-[13px] border shadow-sm`).
13. `Layout Container (FLEX)`: Utility action button container (`w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center`).
14. `Buttons`: Theme toggle / global action button (`inline-flex items-center justify-center gap-2 rounded-xl`).
15. `Layout Container (FLEX)`: Date filter / frequency dropdown container (`h-9 px-3 text-xs font-medium rounded-xl border bg-white shadow-sm`).
16. `Buttons`: Frequency selector dropdown button (`hover:bg-slate-50 transition-colors`).
17. `Layout Container (GRID)`: 4-Column KPI metric card grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6`).
18. `Layout Container (FLEX)`: Floating Action Button (FAB) outer blur ring (`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-slate-900/10 backdrop-blur-xs shadow-xl`).
19. `Buttons`: Floating Action Button trigger (`flex items-center justify-center hover:scale-105 active:scale-95 transition-all`).
20. `Layout Container (FLEX)`: Floating Action Button inner circular core (`w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg`).

### 3.2 Navigation Sidebar Component (`Sidebar.tsx`)
- **Anatomy:**
  - Fixed-width column: `255.2px` on desktop, overlay drawer on mobile viewports ($< 1024\text{px}$).
  - Top brand section with 32x32px black icon pill (`radius.4 = 12px`), title "ArthaSetu", subtitle "Smart Financial Companion".
  - Scrollable navigation list with 12 items: Home, Transactions, Tips, Stats (Active), Budget, Risk Analysis, Action Plan, Goals, Savings, Tax, Benefits, Profile.
  - Collapse button at top corner (`radius.1 = 3px`, size `20x20px`).
- **Interactive States:**
  - `Default`: Text color `--color-primary-4` (`#65758B`), background transparent.
  - `Hover`: Text color `--color-muted-11` (`#0F172A`), background `--color-surface-25` (`rgba(243, 245, 247, 0.3)` or `hover:bg-slate-100/60`).
  - `Active`: Text color `--color-muted-11` (`#0F172A`), font weight `600`, background `--color-surface-8` (`#FFFFFF`), subtle border `--color-border-1` (`#E1E7EF`), shadow `--shadow-sm`.
  - `Focus-Visible`: Must render `outline: none; box-shadow: 0 0 0 2px #0F172A; outline-offset: 2px`.
- **Keyboard & Pointer Behavior:**
  - Arrow keys (Up/Down) must navigate between items when focus is in sidebar.
  - Enter and Space must trigger navigation.
  - Touch targets on mobile must be minimum $44\text{px}$ high.

### 3.3 Metric Card Component (`MetricCard.tsx`)
- **Anatomy:**
  - Container: White background (`#FFFFFF`), 1px solid border (`#E1E7EF`), radius `16px` (`radius.5`), padding `16px` (`space.8`), shadow `--shadow-1`.
  - Header: Metric label in `font.size.body-sm` (`13px`, `#64748B`), right-aligned trend pill or category icon.
  - Value: Bold numerical readout in `font.size.h1` (`30px`, weight `700`, `#0F172A`), formatted with Indian Rupee symbol (`₹`) or percentage (`%`).
  - Footer: Micro metadata label in `font.size.tiny` (`11px`, `#94A3B8`) indicating inflow source or target benchmark.
- **Variants:**
  - `Income / Positive`: Subtitle accent in `--color-primary-19` (`#059669`), trend tag with up-arrow.
  - `Expense / Outflow`: Subtitle accent in `--color-danger-22` (`#DC2626`), trend tag with outflow marker.
  - `Neutral / Buffer`: Subtitle accent in `--color-primary-4` (`#65758B`).
- **Interactive & Empty States:**
  - Hover: Subtly lifts with `--shadow-2` and `border-color: #CBD5E1`.
  - Loading / Skeleton: Must show shimmer placeholder with `bg-slate-200/70 animate-pulse rounded-md`.
  - Zero/Empty: Must display `₹0` with explicit subtext `"No records this cycle"`, avoiding blank voids.

### 3.4 Floating Action Button (FAB) Component (`QuickAssistantFAB.tsx`)
- **Anatomy:**
  - Outer container: `w-16 h-16` (`64px`), fixed position `bottom-6 right-6`, z-index `50`, border radius `9999px`, background `rgba(15, 23, 42, 0.1)`, backdrop filter `blur(4px)`.
  - Inner button: `w-12 h-12` (`48px`), background `#000000`, border `1px solid rgba(51, 65, 85, 0.5)`, text `#FFFFFF`, icon 20px.
- **States & Micro-interactions:**
  - Hover: Inner button scales to `105%` with transition duration `0.2s cubic-bezier(0.4, 0, 0.2, 1)`.
  - Active / Press: Scales to `95%`.
  - Focus-Visible: Outward ring with `2px solid #0F172A` and `offset 4px`.
- **Touch & Accessibility:**
  - Touch target meets mobile criteria ($64\text{px} \times 64\text{px} > 44\text{px}$).
  - Must include `aria-label="Open AI Financial Assistant or Quick Voice Logging"`.

### 3.5 Chart Widgets & Data Visualizations
- **Monthly Cash Flow & Daily Breakdown (Bar Chart):**
  - Tooltips must render inside a custom styled portal with background `#0F172A`, text `#FFFFFF`, border radius `8px`, and shadow `--shadow-lg`.
  - Grid lines must use `--color-border-13` (`#E1E7EF4D`) with stroke dash `3 3`.
  - Bar corners must use top radius `4px`.
- **Expense Breakdown (Donut Chart):**
  - Segment colors must use accessible contrast palette: Phone (`#2563EB`), Maintenance (`#059669`), Fuel (`#F59E0B`), Food (`#DC2626`).
  - Legend items must be interactive with hover highlighting and keyboard tab focus.
- **Income Velocity Trend (Area / Line Chart):**
  - Gradient fills must transition from primary accent (`rgba(5, 150, 105, 0.25)`) to transparent (`rgba(5, 150, 105, 0.0)`).

---

## 4. Accessibility Requirements & Testable Acceptance Criteria (WCAG 2.2 AA)

### 4.1 Contrast Conformance (Rule 1.4.3 & 1.4.11)
- **Criterion 4.1.1 (Pass/Fail):** All body and headline text against its respective background must achieve a contrast ratio $\ge 4.5:1$ (e.g. `#1F2937` on `#F9FAFB` achieves `12.8:1`; `#FFFFFF` on `#000000` achieves `21:1`).
- **Criterion 4.1.2 (Pass/Fail):** Essential graphical objects and UI boundaries (e.g. form borders `#E1E7EF`, button outlines `#CBD5E1`) must achieve a contrast ratio $\ge 3:1$ against adjacent colors.

### 4.2 Keyboard Navigation & Focus Visibility (Rule 2.1.1, 2.4.7 & 2.4.11)
- **Criterion 4.2.1 (Pass/Fail):** Every interactive element (sidebar links, dropdown selectors, date pickers, FAB, chart legends) must receive focus via standard `Tab` and `Shift + Tab` sequences.
- **Criterion 4.2.2 (Pass/Fail):** Focus indicators must never be set to `outline: none` without a high-contrast replacement ring (`ring-2 ring-slate-900 ring-offset-2`).
- **Criterion 4.2.3 (Pass/Fail):** Modal dialogs and flyout drawers must trap keyboard focus until explicitly dismissed using `Escape` or the close button.

### 4.3 Semantic Structure & Assistive Technology (Rule 1.3.1 & 4.1.2)
- **Criterion 4.3.1 (Pass/Fail):** The page must use exactly one `<h1>` tag denoting the primary operational view. Section dividers must strictly follow `<h2>` and `<h3>` hierarchical progression without skipping levels.
- **Criterion 4.3.2 (Pass/Fail):** Landmark regions must be explicitly declared using `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>` elements.
- **Criterion 4.3.3 (Pass/Fail):** All icon-only buttons (collapse toggle, theme switch, FAB) must possess an explicit `aria-label` or visually hidden `<span className="sr-only">` description.

---

## 5. Content and Tone Standards

### 5.1 Writing Tone
- **Voice:** Concise, confident, data-backed, and implementation-focused.
- **Clarity over Jargon:** Avoid financial abstraction. Instead of *"Optimal liquidity reallocation suggested"*, use *"Move ₹1,200 to Emergency Buffer today"*.
- **Localized Context:** Use standard Indian Rupee notation with comma grouping (e.g. `₹6,600`, `₹1,25,000`).

### 5.2 Microcopy Standards & Examples

| Component State | Good Example | Bad / Prohibited Example | Rationale |
| :--- | :--- | :--- | :--- |
| **KPI Subtitle** | `Inflow across 3 platforms (Swiggy, Zomato, Uber)` | `Various money coming in` | Precise platform attribution empowers immediate trust. |
| **Savings Goal** | `80% of monthly goal reached (Healthy target >25%)` | `Good job keep going` | Specific metrics provide actionable context. |
| **Error Banner** | `Unable to sync bank SMS feed. Re-authenticate via OTP.` | `Something went wrong!!` | Clear diagnosis with next step for recovery. |
| **Empty Filter** | `No transactions found between Oct 01 and Oct 15.` | `Nothing here.` | Explains why no records are visible. |

---

## 6. Anti-Patterns & Prohibited Implementations

The following practices are strictly prohibited in the ArthaSetu codebase:
1. **No Ad-Hoc Hex Values:** Developers must not write `style={{ backgroundColor: '#234455' }}` or arbitrary hex values in CSS. All colors must trace to the token registry.
2. **No Arbitrary Padding / Margins:** Custom spacing classes such as `p-[13px]` or `mt-[19px]` must not be introduced. Only `--space-1` through `--space-11` are permissible.
3. **No Invisible Focus Indicators:** `outline: none` without an accompanying `:focus-visible` ring is a critical deployment blocker.
4. **No Color-Only State Indicators:** Metric health must never rely solely on green/red hues; an accompanying icon or textual direction (`+14%`, `-8%`, `Over target`) must be included for color-blind accessibility.
5. **No Undefined Overflow in Data Tables:** Numerical tables must specify fixed header behavior, truncate overflowing labels with tooltips, and allow horizontal scrolling without breaking the layout shell.

---

## 7. Quality Assurance (QA) Checklist

Before merging UI updates into production, engineers and designers must verify every check below:

- [ ] **Token Validation:** Are all colors, paddings, fonts, and radii mapped to `--color-*`, `--space-*`, and `--radius-*` tokens?
- [ ] **Contrast Verification:** Has the page passed automated axe-core / Lighthouse audit with 0 contrast violations?
- [ ] **Keyboard Traversal:** Can a user navigate from the first sidebar item to the FAB exclusively using `Tab`, `Enter`, and arrow keys?
- [ ] **Focus Rings:** Is the focus indicator clearly visible against both white card surfaces and dark background elements?
- [ ] **Responsive Breakpoints:**
  - Mobile ($< 640\text{px}$): Sidebar collapses into drawer; metric grid reflows to 1 column.
  - Tablet ($640\text{px} - 1024\text{px}$): Metric grid displays 2 columns; charts stack vertically.
  - Desktop ($> 1024\text{px}$): Sidebar fixed at $255\text{px}$; metric grid displays 4 columns.
- [ ] **Empty & Error States:** Have mock loading skeletons, empty data states, and API error banners been validated?
- [ ] **ARIA Completeness:** Do all icon buttons, popover triggers, and dynamic chart tooltips feature valid `aria-*` tags?
