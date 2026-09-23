import { Section } from "@/shared/ui/section";
import styles from "./About.module.css";

export function About() {
  return (
    <Section id="about" title="About me" number="01">
      <div className={styles.copy}>
        <p className={styles.lead}>
          An engineer who likes to understand
          <br className={styles.break} /> how the whole thing works.
        </p>
        <p>
          I’m a full-stack engineer with 3+ years of experience building web
          applications with React, NestJS, and PostgreSQL. My work spans
          enterprise software, real-time tools, and AI integrations.
        </p>
        <p>
          I’ve worked on everything from financial transactions to internal AI
          assistants. I’m interested in making complex systems easier to use and
          easier to maintain.
        </p>
      </div>
    </Section>
  );
}
