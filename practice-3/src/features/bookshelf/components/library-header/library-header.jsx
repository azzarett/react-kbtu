import { Button } from "@/common/components/ui/button";
import styles from "./library-header.module.css";

export function LibraryHeader({ formOpen, onToggleForm }) {
  return (
    <section className={styles.intro} aria-labelledby="page-title">
      <div>
        <p className={styles.eyebrow}>ЛИЧНАЯ КОЛЛЕКЦИЯ</p>
        <h1 id="page-title" className={styles.title}>
          Моя библиотека
        </h1>
        <p className={styles.introDescription}>
          Читать в своём темпе. Сохранять важное.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        className={styles.addButton}
        aria-expanded={formOpen}
        onClick={onToggleForm}
      >
        <span aria-hidden="true">{formOpen ? "−" : "+"}</span>{" "}
        {formOpen ? "Закрыть форму" : "Добавить книгу"}
      </Button>
    </section>
  );
}
