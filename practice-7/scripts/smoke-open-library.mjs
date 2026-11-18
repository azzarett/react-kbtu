import assert from "node:assert/strict";
import { searchBooks, getCatalogBook } from "../src/features/catalog/services/open-library.js";

// Optional live check, deliberately excluded from deterministic CI tests.
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 20000);
try {
  const result = await searchBooks("Tolkien", { signal: controller.signal });
  assert.ok(result.total > 0);
  assert.ok(result.books.length > 0);
  const book = await getCatalogBook(result.books[0].id, { signal: controller.signal });
  assert.equal(book.id, result.books[0].id);
  assert.ok(book.title);
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), query: "Tolkien", count: result.books.length, total: result.total, book: { id: book.id, title: book.title, descriptionLength: book.description.length, subjects: book.subjects.length, sourceUrl: book.sourceUrl } }, null, 2));
} finally {
  clearTimeout(timer);
}
