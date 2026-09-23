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

## Architecture: Feature-Sliced Design

```text
src/
  app/                         # App entry, global reset and design tokens
  pages/home/                  # Page composition
  widgets/                     # Intro, about, experience, stack, background, contact, layout
  features/experience-details/ # View/hide professional contributions
  entities/
    profile/                   # Public profile, links, skill groups
    experience/                # Career data and ExperienceRow presentation
  shared/ui/                   # TextLink, Section, InlineList, Disclosure
```

- Layers import only lower layers; slices on the same layer stay independent.
- Each slice exposes a public API through `index.js`.
- `@/` points to `src/` (configured in Vite and `jsconfig.json`).
- Every styled component has its own `*.module.css`; only reset, typography,
  and design tokens are global in `app/styles/`.
- `ExperienceRow` accepts children as a slot. The widget composes the entity
  with the feature, so the entity never imports the feature above it.
- Shared UI is domain-independent and reused across widgets and features.
- `npm run lint` runs Oxlint and a static FSD import-boundary check.

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
