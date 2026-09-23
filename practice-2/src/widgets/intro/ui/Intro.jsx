import { profile } from "@/entities/profile";
import { TextLink } from "@/shared/ui/text-link";
import styles from "./Intro.module.css";

export function Intro() {
  return (
    <section id="home" className={styles.intro} aria-labelledby="intro-title">
      <div className={styles.copy}>
        <p className={styles.location}>{profile.location}</p>
        <h1 id="intro-title">
          Azat
          <br />
          Bertayev<span>.</span>
        </h1>
        <p className={styles.role}>{profile.role}</p>
        <p className={styles.description}>
          I build web applications — from the interface
          <br className={styles.break} /> to the systems behind it.
        </p>
        <div className={styles.links}>
          <TextLink href={profile.links.linkedin} external>
            LinkedIn
          </TextLink>
          <TextLink href={profile.links.github} external>
            GitHub
          </TextLink>
        </div>
      </div>
      <figure className={styles.figure}>
        <img
          src={profile.portrait}
          alt="Azat Bertayev"
          width="576"
          height="1024"
          fetchPriority="high"
        />
        <figcaption>
          <span>Currently</span>
          <span>Team Lead, DukenAI</span>
        </figcaption>
      </figure>
    </section>
  );
}
