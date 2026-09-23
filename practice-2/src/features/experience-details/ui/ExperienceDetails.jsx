import { Disclosure } from "@/shared/ui/disclosure";
import styles from "./ExperienceDetails.module.css";

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
