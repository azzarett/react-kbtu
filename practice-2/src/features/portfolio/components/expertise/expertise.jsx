import { skills } from "../../constants/profile";
import { Section } from "@/common/components/ui/section";
import { InlineList } from "@/common/components/ui/inline-list";
import styles from "./expertise.module.css";

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
