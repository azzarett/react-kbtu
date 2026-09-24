import { profile } from "../../constants/profile";
import { TextLink } from "@/common/components/ui/text-link";
import styles from "./site-layout.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <a className={styles.name} href="#home">
        {profile.name}
        <span className={styles.monogram}>AB</span>
      </a>
      <nav className={styles.nav} aria-label="Main navigation">
        <a href="#about">About</a>
        <a href="#experience">Experience</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span>
        © {new Date().getFullYear()} {profile.name}
      </span>
      <span>Built with React & Vite</span>
      <TextLink href="#home">Back to top ↑</TextLink>
    </footer>
  );
}
