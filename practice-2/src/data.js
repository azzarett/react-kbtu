export const links = {
  github: "https://github.com/azzarett",
  linkedin: "https://www.linkedin.com/in/azat-bertayev-1a20342b6/",
  article:
    "https://weproject.media/articles/detail/enactus-v-tsentralnoy-azii-studenty-ob-uchastii-v-proektakh-organizatsii-i-kachestvennom-netvorkinge/",
};

// Supplied LinkedIn screenshots, September 2026. The detailed experience view
// gives Work Loop's end date as August 2026.
export const jobs = [
  {
    company: "DukenAI",
    role: "Team Lead",
    dates: "Aug 2026 — Present",
    mark: "d",
    color: "green",
    current: true,
    summary:
      "A new chapter in team leadership, built on a foundation of full-stack engineering.",
    details: [
      "Full-time team leadership role, working remotely from Almaty.",
      "Previous experience spans enterprise SaaS, internal AI tools, and high-load web applications.",
    ],
    tags: ["Team leadership", "Full-stack engineering"],
  },
  {
    company: "Work Loop",
    role: "Senior Software Engineer",
    dates: "Jan 2026 — Aug 2026",
    mark: "w",
    color: "blue",
    summary:
      "Built the operational backbone for distributed organizations, reducing manual work by about 30%.",
    details: [
      "Developed attendance, scheduling, payroll, task management, and notification modules.",
      "Implemented role-based access, audit logs, and secure authentication.",
      "Created real-time dashboards and workflows with React Query and WebSockets.",
    ],
    tags: ["React", "NestJS", "PostgreSQL", "Redis"],
  },
  {
    company: "Impact Admissions",
    role: "Senior Software Engineer",
    dates: "Mar 2025 — Jan 2026",
    mark: "i",
    color: "peach",
    summary:
      "Turned AI into practical internal tools, saving 5–10 hours of manual work every week.",
    details: [
      "Architected an internal Llama-2 assistant to reduce external API dependency and costs.",
      "Built NestJS microservices for LLM orchestration and automated PDF generation.",
      "Developed React and shadcn/ui interfaces with asynchronous workflows and real-time status updates.",
    ],
    tags: ["React", "NestJS", "Llama-2", "React Query"],
  },
  {
    company: "Цедра / Cedra",
    role: "Software Engineer",
    dates: "Apr 2023 — Mar 2025",
    mark: "c",
    color: "purple",
    summary:
      "Developed auction, finance, and business platforms, automating roughly 40% of manual operational tasks.",
    details: [
      "Built high-concurrency systems with React, NestJS, and PostgreSQL.",
      "Implemented transactional financial operations and scalable REST APIs.",
      "Improved performance with Docker, Redis caching, and frontend optimization.",
    ],
    tags: ["TypeScript", "PostgreSQL", "Docker", "Redis"],
  },
];

export const toolkit = [
  {
    title: "Frontend",
    items: [
      "React",
      "TypeScript",
      "JavaScript",
      "React Query",
      "shadcn/ui",
      "Vite",
    ],
  },
  {
    title: "Backend & data",
    items: ["NestJS", "PostgreSQL", "Redis", "REST APIs", "WebSockets"],
  },
  {
    title: "Tools & systems",
    items: ["Docker", "Git", "LLM integration", "RBAC", "Microservices"],
  },
];
