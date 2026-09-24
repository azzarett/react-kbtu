import { Disclosure } from "@/common/components/ui/disclosure";
import styles from "./experience-details.module.css";

export function ExperienceDetails({ contributions }) {
  return (
    <Disclosure label="View contributions" expandedLabel="Hide contributions">
      <ul className={styles.list}>
        {contributions.map((contribution) => (
          <li key={contribution}>{contribution}</li>
        ))}
      </ul>
    </Disclosure>
  );
}
