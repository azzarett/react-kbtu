import { profile } from "../../constants/profile";
import { Section } from "@/common/components/ui/section";
import { TextLink } from "@/common/components/ui/text-link";
import styles from "./contact.module.css";

export function Contact() {
  return (
    <Section id="contact" title="Contact" number="05">
      <h3 className={styles.title}>Let’s talk.</h3>
      <p className={styles.description}>
        For a project, a question, or a conversation about software.
      </p>
      <div className={styles.links}>
        <TextLink href={profile.links.linkedin} external>
          LinkedIn
        </TextLink>
        <TextLink href={profile.links.github} external>
          GitHub
        </TextLink>
      </div>
      <p className={styles.address}>Almaty, Kazakhstan · Planet Earth</p>
    </Section>
  );
}
