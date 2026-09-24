# Azat Bertayev — React portfolio

A responsive self-promotional SPA created with the official Vite React template:

```sh
npm create vite@latest practice-2 -- --template react --no-interactive
```

## Run locally

Use Node.js 22.12+ or 24 LTS.

```sh
cd practice-2
npm ci
npm run dev
```

```sh
npm run lint
npm run build
npm run preview
```

## Architecture: common + features

The structure follows the same principles as `aurora-client`, scaled to a single
portfolio screen. The app remains React + Vite with JavaScript.

```text
src/
  main.jsx
  App.jsx                          # Application composition
  common/
    components/ui/                 # Disclosure, InlineList, Section, TextLink
      text-link/
        index.js
        text-link.jsx
        text-link.module.css
    styles/                        # Global base styles and design tokens
  features/
    portfolio/
      portfolio-view.jsx           # Thin screen composition
      portfolio-view.module.css
      constants/                   # Profile, links, skills, career data
      components/                  # Portfolio-specific sections and layout
        intro/
          intro.jsx
          intro.module.css
        experience/
          experience.jsx
        experience-row/
          experience-row.jsx
          experience-row.module.css
        experience-details/
          experience-details.jsx
          experience-details.module.css
```

- `App` assembles the screen; `portfolio-view` composes its sections.
- Domain-specific content stays inside `features/portfolio`.
- `common` contains domain-independent UI primitives and application infrastructure.
- Dependencies point from the app to features/common and from features to common.
  Common code cannot import features, and features cannot import other features.
- Local imports are relative; `@/` points to `src/` for shared/app-level imports.
- Component files use kebab-case, with colocated `*.module.css` styles.
  Only reset, typography, and design tokens are global in `common/styles/`.
- Simple disclosure state stays in its component. Add feature hooks for actual
  screen logic when needed; this static SPA needs no router, API layer, or store.
- There is no Tailwind or UI component library. `lucide-react` supplies icons only.
- `npm run lint` runs Oxlint and checks the common/features dependency boundaries.

The interface uses a white background, black typography, a single blue accent,
a monochrome portrait, and thin separators. Layouts adapt to small screens.
Disclosure controls support keyboard interaction and expose expanded state.
The page also includes a skip link, visible focus styles, and reduced-motion support.

## Sources

Career roles, dates, and achievements are based on the supplied LinkedIn screenshots
(September 2026). The detailed experience view lists Work Loop as January–August 2026.
Education and community context also use the October 2024
[WE Project interview](https://weproject.media/articles/detail/enactus-v-tsentralnoy-azii-studenty-ob-uchastii-v-proektakh-organizatsii-i-kachestvennom-netvorkinge/).
The portrait `public/azat.jpg` comes from that interview.
No private contact details, screenshot UI, or private job-search status are published.

## Deployment and submission

GitHub Actions builds Vite and publishes the output under `/react-kbtu/practice-2/`.
The repository root redirects to the portfolio. Practice 1 stays available under
`/react-kbtu/practice-1/`. The relative Vite base keeps asset paths working in the subfolder.
The workflow is `.github/workflows/deploy-pages.yml` at the repository root.
GitHub Settings → Pages must use **GitHub Actions** as the source.

- Repository: https://github.com/azzarett/react-kbtu/tree/main/practice-2
- Application: https://azzarett.github.io/react-kbtu/practice-2/
- Screenshot: `screenshots/portfolio.png`

Attach the links and screenshot to the assignment, then press **Turn In** in your course platform.
