import styles from "./library-summary.module.css";

export function LibrarySummary({ total, counts }) {
  return (
    <dl className={styles.summary}>
      <div>
        <dt>На полке</dt>
        <dd>{String(total).padStart(2, "0")}</dd>
      </div>
      <div>
        <dt>Сейчас читаю</dt>
        <dd>{String(counts.reading).padStart(2, "0")}</dd>
      </div>
      <div>
        <dt>Прочитано</dt>
        <dd>{String(counts.finished).padStart(2, "0")}</dd>
      </div>
    </dl>
  );
}
