export const profile = {
  name: "Azat Bertayev",
  role: "Full-stack engineer & team lead",
  location: "Almaty, Kazakhstan",
  portrait: `${import.meta.env.BASE_URL}azat.jpg`,
  links: {
    github: "https://github.com/azzarett",
    linkedin: "https://www.linkedin.com/in/azat-bertayev-1a20342b6/",
    article:
      "https://weproject.media/articles/detail/enactus-v-tsentralnoy-azii-studenty-ob-uchastii-v-proektakh-organizatsii-i-kachestvennom-netvorkinge/",
  },
};
export const skills = [
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
    title: "Backend",
    items: ["NestJS", "PostgreSQL", "Redis", "REST APIs", "WebSockets"],
  },
  {
    title: "Systems",
    items: ["Docker", "Git", "Microservices", "LLM integration", "RBAC"],
  },
];
