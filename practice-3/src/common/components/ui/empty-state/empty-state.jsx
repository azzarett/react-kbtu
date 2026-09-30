import { Button } from "../button";
import styles from "./empty-state.module.css";

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState}>
      <h2>{title}</h2>
      <p>{description}</p>
      <Button variant="text" onClick={onAction}>
        {actionLabel} <span aria-hidden="true">↗</span>
      </Button>
    </div>
  );
}
