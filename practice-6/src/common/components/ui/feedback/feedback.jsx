import { Button } from "../button";
import styles from "./feedback.module.css";

export function Feedback({
  title,
  description,
  error = false,
  loading = false,
  actionLabel,
  onAction,
}) {
  return (
    <div
      className={`${styles.feedback} ${error ? styles.error : ""}`}
      role={error ? "alert" : "status"}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <p className={styles.title}>{title}</p>
      {description && <p>{description}</p>}
      {onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
