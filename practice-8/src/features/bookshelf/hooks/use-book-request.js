import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadBooks } from "../state/bookshelf-slice.js";
import {
  selectBookDetails,
  selectBookMutation,
  selectCollectionError,
  selectCollectionStatus,
} from "../state/bookshelf-selectors.js";

export function useCollectionRequest(enabled = true) {
  const dispatch = useDispatch();
  const status = useSelector(selectCollectionStatus);
  const error = useSelector(selectCollectionError);
  const busy = useSelector((state) => selectBookMutation(state) !== null);

  useEffect(() => {
    if (enabled && !busy) dispatch(loadBooks());
  }, [busy, dispatch, enabled]);

  return {
    status: status === "idle" ? "loading" : status,
    error,
    reload: () => dispatch(loadBooks({ force: true })),
  };
}

export function useBookRequest(id, valid = true) {
  const request = useCollectionRequest(valid);
  const book = useSelector((state) => selectBookDetails(state, id));
  if (!valid) return { ...request, status: "error", error: "Некорректный идентификатор книги." };
  if (request.status === "success" && !book) {
    return { ...request, status: "error", error: "Книга не найдена. Обновите список." };
  }
  return { ...request, book };
}
