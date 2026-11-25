import { configureStore } from "@reduxjs/toolkit";
import connectivity from "@/common/pwa/connectivity-slice";
import { bookshelfReducer } from "@/features/bookshelf/state/bookshelf-slice";
import catalog from "@/features/catalog/state/catalog-slice";

export function createAppStore() {
  return configureStore({ reducer: { bookshelf: bookshelfReducer, catalog, connectivity } });
}
