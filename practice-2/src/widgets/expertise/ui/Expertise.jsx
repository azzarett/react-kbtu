import { skills } from "@/entities/profile";
import { Section } from "@/shared/ui/section";
import { InlineList } from "@/shared/ui/inline-list";
import styles from "./Expertise.module.css";

export function Expertise() {
  return (
    <Section id="expertise" title="Stack" number="03">
      <dl className={styles.groups}>
        {skills.map((group) => (
          <div key={group.title} className={styles.group}>
            <dt>{group.title}</dt>
            <dd>
              <InlineList items={group.items} label={group.title} />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
