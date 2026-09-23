import styles from "./InlineList.module.css";

export function InlineList({ items, label }) {
  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
