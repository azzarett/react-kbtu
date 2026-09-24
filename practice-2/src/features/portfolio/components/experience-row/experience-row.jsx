import { InlineList } from "@/common/components/ui/inline-list";
import styles from "./experience-row.module.css";

export function ExperienceRow({ job, children }) {
  return (
    <article className={styles.row}>
      <div className={styles.heading}>
        <h3>{job.company}</h3>
        <span className={styles.dates}>{job.dates}</span>
      </div>
      <p className={styles.role}>
        {job.role}
        {job.current && <span className={styles.current}>Current</span>}
      </p>
      <p className={styles.summary}>{job.summary}</p>
      <InlineList items={job.tags} label={`${job.company} skills`} />
      {children}
    </article>
  );
}
