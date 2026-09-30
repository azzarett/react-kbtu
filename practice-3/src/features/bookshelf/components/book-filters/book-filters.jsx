import { VisuallyHidden } from "@/common/components/ui/visually-hidden";
import { statuses } from "../../constants/statuses";
import styles from "./book-filters.module.css";

export function BookFilters({
  filter,
  query,
  reversed,
  total,
  counts,
  visibleCount,
  onFilterChange,
  onQueryChange,
  onReverse,
}) {
  return (
    <>
      <div className={styles.collectionToolbar}>
        <div
          className={styles.filterList}
          role="group"
          aria-label="Фильтр по статусу"
        >
          {[{ value: "all", label: "Все книги" }, ...statuses].map(
            ({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                className={`${styles.filter} ${filter === value ? styles.active : ""}`}
                onClick={() => onFilterChange(value)}
              >
                {label}
                <span>{value === "all" ? total : counts[value]}</span>
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          className={styles.orderButton}
          aria-pressed={reversed}
          onClick={onReverse}
        >
          <span aria-hidden="true">{reversed ? "↑" : "↓"}</span>{" "}
          {reversed ? "Сначала новые" : "Сначала старые"}
        </button>
      </div>
      <div className={styles.searchRow}>
        <label className={styles.searchField}>
          <svg
            viewBox="0 0 20 20"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m13 13 4 4" />
          </svg>
          <VisuallyHidden>Поиск по названию или автору</VisuallyHidden>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Найти книгу или автора"
          />
        </label>
        <span className={styles.resultCount} role="status">
          На экране: {visibleCount} из {total}
        </span>
      </div>
    </>
  );
}
