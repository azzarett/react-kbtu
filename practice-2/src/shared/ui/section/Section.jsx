import styles from "./Section.module.css";

export function Section({ id, title, number, children }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <div className={styles.label}>
        <span aria-hidden="true">{number}</span>
        <h2 id={`${id}-title`}>{title}</h2>
      </div>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
