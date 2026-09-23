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

## React components

`src/App.jsx` contains Header, Hero, About, Experience, ExperienceCard, TechStack,
Beyond, Contact, Footer, plus reusable ExternalLink and SectionLabel components.
Career information and skill groups live in `src/data.js`.

- `useState`: mobile navigation and expandable experience cards.
- `useEffect` / IntersectionObserver: active section in navigation.
- Responsive CSS, keyboard focus styles, a skip link, reduced-motion support.
- Contact section contains only public GitHub and LinkedIn links and a playful address.

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
