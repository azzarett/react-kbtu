import { EmptyState } from "@/common/components/ui/empty-state";
import { SiteHeader, SiteFooter } from "./components/site-layout/site-layout";
import { LibraryHeader } from "./components/library-header/library-header";
import { LibrarySummary } from "./components/library-summary/library-summary";
import { AddBookForm } from "./components/add-book-form/add-book-form";
import { BookFilters } from "./components/book-filters/book-filters";
import { BookList } from "./components/book-list/book-list";
import { useBookshelf } from "./hooks/use-bookshelf";
import styles from "./bookshelf-view.module.css";

export function BookshelfView() {
  const shelf = useBookshelf();
  const hasBooks = shelf.books.length > 0;
  console.log("[BookshelfView render]", {
    count: shelf.books.length,
    filter: shelf.filter,
    query: shelf.query,
    reversed: shelf.reversed,
  });
  return (
    <div className={styles.appShell}>
      <a className={styles.skipLink} href="#books">
        К списку книг
      </a>
      <SiteHeader />
      <main>
        <LibraryHeader
          formOpen={shelf.formOpen}
          onToggleForm={shelf.toggleForm}
        />
        <LibrarySummary total={shelf.books.length} counts={shelf.counts} />
        {shelf.formOpen && (
          <AddBookForm onAdd={shelf.addBook} onClose={shelf.closeForm} />
        )}
        <section id="books" aria-label="Книги на полке">
          <BookFilters
            filter={shelf.filter}
            query={shelf.query}
            reversed={shelf.reversed}
            total={shelf.books.length}
            counts={shelf.counts}
            visibleCount={shelf.visibleCount}
            onFilterChange={shelf.setFilter}
            onQueryChange={shelf.setQuery}
            onReverse={shelf.toggleOrder}
          />
          <BookList
            books={shelf.orderedBooks}
            isVisible={shelf.isVisible}
            onStatusChange={shelf.changeStatus}
            onReset={shelf.resetBook}
            onRemove={shelf.removeBook}
          />
          {shelf.visibleCount === 0 && (
            <EmptyState
              title={
                hasBooks ? "Книг не нашлось" : "Здесь начнётся ваша библиотека"
              }
              description={
                hasBooks
                  ? "Попробуйте другое название или выберите все книги."
                  : "Добавьте первую книгу, которую хотите прочитать."
              }
              actionLabel={hasBooks ? "Сбросить фильтры" : "Добавить книгу"}
              onAction={hasBooks ? shelf.clearFilters : shelf.openForm}
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
