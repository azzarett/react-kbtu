import { profile } from "../../constants/profile";
import { Section } from "@/common/components/ui/section";
import { TextLink } from "@/common/components/ui/text-link";
import styles from "./background.module.css";

export function Background() {
  return (
    <Section id="background" title="Outside of work" number="04">
      <div className={styles.block}>
        <div className={styles.heading}>
          <h3>Enactus KBTU</h3>
          <span>2024 — 2025</span>
        </div>
        <p className={styles.subtitle}>Head of University Team</p>
        <p className={styles.description}>
          Led the university team in a community focused on social
          entrepreneurship. Worked on student projects and learned from people
          across business and technology.
        </p>
        <TextLink href={profile.links.article} external>
          Read my interview in WE Project
        </TextLink>
      </div>
      <div className={styles.education}>
        <h3>Education</h3>
        <div>
          <p>Kazakh-British Technical University</p>
          <span>Information Systems</span>
        </div>
        <div>
          <p>Nazarbayev Intellectual Schools</p>
          <span>2017 — 2023</span>
        </div>
      </div>
    </Section>
  );
}
