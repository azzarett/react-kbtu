import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  Code2,
  GitFork,
  Network,
  MapPin,
  Menu,
  X,
  Plus,
  Minus,
  Globe2,
  GraduationCap,
} from "lucide-react";
import { jobs, links, toolkit } from "./data";
import "./App.css";

const Github = GitFork;
const Linkedin = Network;

function ExternalLink({ href, children, className = "" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-10% 0px -55% 0px" },
    );
    document
      .querySelectorAll("section[id]")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Azat Bertayev home">
        ab<span>.</span>
      </a>
      <button
        className="menu-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="main-nav"
        className={`nav ${open ? "open" : ""}`}
        aria-label="Main navigation"
      >
        {[
          ["about", "About"],
          ["experience", "Experience"],
          ["beyond", "Beyond code"],
        ].map(([id, title]) => (
          <a
            key={id}
            href={`#${id}`}
            className={active === id ? "active" : ""}
            aria-current={active === id ? "location" : undefined}
            onClick={() => setOpen(false)}
          >
            {title}
          </a>
        ))}
        <a
          className="nav-contact"
          href="#contact"
          onClick={() => setOpen(false)}
        >
          Let’s connect <ArrowUpRight size={16} />
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="status-dot" /> ENGINEER. BUILDER. TEAM PLAYER.
        </p>
        <h1 id="hero-title">
          Hi, I’m Azat<span className="title-dot">.</span>
          <br />I turn ideas into
          <br />
          <span className="serif">working things.</span>
        </h1>
        <p className="hero-description">
          Full-stack engineer & team lead crafting scalable
          <br className="desktop-break" /> web applications with a thoughtful
          human touch.
        </p>
        <div className="hero-actions">
          <a href="#experience" className="button button-dark">
            Explore my experience <ArrowDown size={17} />
          </a>
          <ExternalLink href={links.github} className="text-link">
            <Github size={18} /> GitHub <ArrowUpRight size={15} />
          </ExternalLink>
        </div>
        <p className="hero-location">
          <MapPin size={15} /> Almaty, Kazakhstan <span>·</span> Building for
          the web
        </p>
      </div>
      <div className="portrait-composition">
        <div className="portrait-frame">
          <img
            src="./azat.jpg"
            alt="Azat Bertayev"
            width="700"
            height="850"
            fetchPriority="high"
          />
          <span className="portrait-caption">
            A little curiosity goes a long way.
          </span>
        </div>
        <div className="floating-note">
          <span className="note-icon">
            <Code2 size={23} />
          </span>
          <div>
            <strong>From idea to impact</strong>
            <span>One thoughtful build at a time.</span>
          </div>
          <span className="note-spark" aria-hidden="true">
            ✳
          </span>
        </div>
        <span className="portrait-index">01 / A LITTLE INTRODUCTION</span>
        <span className="portrait-star" aria-hidden="true">
          ✳
        </span>
      </div>
      <div className="hero-bottom">
        <span>GOOD SOFTWARE STARTS WITH UNDERSTANDING PEOPLE.</span>
        <a href="#about" aria-label="Scroll to About Me">
          <ArrowDown size={18} />
        </a>
      </div>
    </section>
  );
}

function SectionLabel({ number, children }) {
  return (
    <p className="section-label">
      <span>{number}</span>
      {children}
    </p>
  );
}

function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <SectionLabel number="01">ABOUT ME</SectionLabel>
      <div className="about-grid">
        <h2 id="about-title">
          An engineer’s mind.
          <br />
          <span className="serif">A builder’s curiosity.</span>
        </h2>
        <div className="about-copy">
          <p>
            I’m Azat Bertayev, a full-stack engineer with 3+ years of experience
            turning complex business needs into reliable, intuitive web
            applications.
          </p>
          <p>
            From enterprise SaaS and real-time dashboards to internal AI tools,
            I work across the stack with React, NestJS, and PostgreSQL. I care
            about clear interfaces, maintainable systems, and less busywork for
            the people using them.
          </p>
          <p>
            Today, I’m a Team Lead at <strong>DukenAI</strong>. Beyond
            engineering, my experience with Enactus KBTU has shaped how I
            collaborate, take initiative, and connect technology with real-world
            impact.
          </p>
        </div>
      </div>
      <div className="stats">
        <div>
          <strong>
            3<span>+</span>
          </strong>
          <span>Years building software</span>
        </div>
        <div>
          <strong>4</strong>
          <span>Teams along the journey</span>
        </div>
        <div>
          <strong>
            Full<span> stack</span>
          </strong>
          <span>From interface to infrastructure</span>
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({ job, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="experience-card">
      <div className={`company-mark ${job.color}`} aria-hidden="true">
        {job.mark}
        <span>.</span>
      </div>
      <div className="experience-body">
        <div className="job-topline">
          <h3>{job.company}</h3>
          {job.current && (
            <span className="current-badge">
              <span className="status-dot" />
              CURRENT
            </span>
          )}
          <span className="job-dates">{job.dates}</span>
        </div>
        <p className="job-role">{job.role}</p>
        <p className="job-summary">{job.summary}</p>
        <div className="job-bottom">
          <div className="tags">
            {job.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <button
            className="details-button"
            aria-expanded={expanded}
            aria-controls={`job-${index}`}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Less" : "Details"}
            {expanded ? <Minus size={15} /> : <Plus size={15} />}
          </button>
        </div>
        <div id={`job-${index}`} hidden={!expanded}>
          <ul className="job-details">
            {job.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function Experience() {
  return (
    <section
      id="experience"
      className="section"
      aria-labelledby="experience-title"
    >
      <SectionLabel number="02">THE JOURNEY</SectionLabel>
      <div className="section-heading">
        <h2 id="experience-title">
          Experience that <span className="serif">adds up.</span>
        </h2>
        <p className="small-note">
          Different teams. Real problems. Meaningful work.
        </p>
      </div>
      <div className="experience-list">
        {jobs.map((job, index) => (
          <ExperienceCard key={job.company} job={job} index={index} />
        ))}
      </div>
    </section>
  );
}

function TechStack() {
  return (
    <section className="section" aria-labelledby="stack-title">
      <SectionLabel number="03">MY TOOLKIT</SectionLabel>
      <div className="section-heading">
        <h2 id="stack-title">
          The tools behind <span className="serif">the work.</span>
        </h2>
        <Code2 size={32} />
      </div>
      <div className="stack-grid">
        {toolkit.map((group, index) => (
          <article className="stack-group" key={group.title}>
            <span className="stack-number">0{index + 1}</span>
            <h3>{group.title}</h3>
            <div className="tags">
              {group.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Beyond() {
  return (
    <section id="beyond" className="section" aria-labelledby="beyond-title">
      <SectionLabel number="04">BEYOND CODE</SectionLabel>
      <h2 id="beyond-title">
        Building software.
        <br />
        <span className="serif">Growing with people.</span>
      </h2>
      <div className="beyond-grid">
        <article className="community-card">
          <div className="card-topline">
            <Globe2 size={22} />
            <span>COMMUNITY & LEADERSHIP</span>
          </div>
          <h3>
            Enactus KBTU
            <span className="enactus-star" aria-hidden="true">
              ✳
            </span>
          </h3>
          <p className="community-role">
            Head of University Team <span>Jun 2024 — Jun 2025</span>
          </p>
          <p>
            Social entrepreneurship taught me to look beyond the code. Through
            Enactus, I worked with a university team, learned from
            professionals, and explored how student-led projects can make a
            difference.
          </p>
          <ExternalLink href={links.article} className="article-link">
            <span>
              <small>FEATURED IN WE PROJECT · OCT 2024</small>My Enactus story
            </span>
            <ArrowUpRight size={24} />
          </ExternalLink>
        </article>
        <article className="education-card">
          <div className="card-topline">
            <GraduationCap size={23} />
            <span>ALWAYS LEARNING</span>
          </div>
          <div className="education-entry">
            <span className="education-year">UNIVERSITY</span>
            <h3>
              Kazakh-British
              <br />
              Technical University
            </h3>
            <p>Information Systems</p>
          </div>
          <div className="education-entry">
            <span className="education-year">2017 — 2023</span>
            <h3>
              Nazarbayev
              <br />
              Intellectual Schools
            </h3>
            <p>A foundation for a curious mind.</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section
      id="contact"
      className="contact-section"
      aria-labelledby="contact-title"
    >
      <div className="contact-top">
        <p className="eyebrow">GOOD THINGS START WITH A CONVERSATION</p>
        <span className="contact-star" aria-hidden="true">
          ✳
        </span>
      </div>
      <h2 id="contact-title">
        Have an idea?
        <br />
        <span className="serif">Let’s make it happen.</span>
      </h2>
      <div className="contact-bottom">
        <p>
          Say hello, talk tech, or share something interesting.
          <br />
          You’ll find me on these corners of the internet.
        </p>
        <div className="contact-links">
          <ExternalLink href={links.linkedin} className="button button-light">
            <Linkedin size={18} /> LinkedIn <ArrowUpRight size={17} />
          </ExternalLink>
          <ExternalLink href={links.github} className="button button-outline">
            <Github size={18} /> GitHub <ArrowUpRight size={17} />
          </ExternalLink>
        </div>
      </div>
      <p className="planet">
        <Globe2 size={14} /> Address: Planet Earth. Currently, Almaty.
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <a href="#home" className="brand" aria-label="Back to top">
        ab<span>.</span>
      </a>
      <span>© {new Date().getFullYear()} Azat Bertayev</span>
      <span className="built-with">Made with React & a little curiosity.</span>
      <a href="#home" className="back-top">
        Back to top <ArrowUp size={15} />
      </a>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <div className="page-shell">
        <Header />
        <main>
          <Hero />
          <About />
          <Experience />
          <TechStack />
          <Beyond />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}
