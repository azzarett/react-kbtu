// Career facts from the supplied LinkedIn screenshots (September 2026).
export const jobs = [
  {
    company: "DukenAI",
    role: "Team Lead",
    dates: "Aug 2026 — Present",
    current: true,
    summary: "Leading the team at DukenAI. Full-time, remote from Almaty.",
    details: [],
    tags: ["Team leadership", "Full-stack engineering"],
  },
  {
    company: "Work Loop",
    role: "Senior Software Engineer",
    dates: "Jan 2026 — Aug 2026",
    summary:
      "Built attendance, payroll, scheduling, and task management tools for distributed teams. Reduced manual operational work by about 30%.",
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
    summary:
      "Built an internal AI assistant and automated document workflows, saving 5–10 hours of manual work per week.",
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
    summary:
      "Developed auction, finance, and business management applications. Automated roughly 40% of manual operational tasks.",
    details: [
      "Built high-concurrency systems with React, NestJS, and PostgreSQL.",
      "Implemented transactional financial operations and scalable REST APIs.",
      "Improved performance with Docker, Redis caching, and frontend optimization.",
    ],
    tags: ["TypeScript", "PostgreSQL", "Docker", "Redis"],
  },
];
