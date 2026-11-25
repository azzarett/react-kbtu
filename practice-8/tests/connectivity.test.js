import assert from "node:assert/strict";
import { test } from "node:test";
import reducer, { catalogSourceChanged, checkConnection, disconnected } from "../src/common/pwa/connectivity-slice.js";

test("a late probe cannot override a subsequent offline event or a newer probe", () => {
  let state = reducer(undefined, checkConnection.pending("first"));
  state = reducer(state, disconnected());
  state = reducer(state, checkConnection.fulfilled(undefined, "first"));
  assert.equal(state.online, false);

  state = reducer(state, checkConnection.pending("second"));
  state = reducer(state, checkConnection.pending("third"));
  state = reducer(state, checkConnection.fulfilled(undefined, "third"));
  state = reducer(state, checkConnection.rejected(new Error("timeout"), "second"));
  assert.equal(state.online, true);
  assert.equal(state.check, "success");
});

test("cached and live catalog responses update the shared connectivity indicator", () => {
  let state = reducer(undefined, disconnected());
  state = reducer(state, catalogSourceChanged("cached"));
  assert.equal(state.online, false);
  assert.equal(state.catalogSource, "cached");
  state = reducer(state, checkConnection.pending("probe"));
  state = reducer(state, catalogSourceChanged("live"));
  state = reducer(state, checkConnection.rejected(new Error("timeout"), "probe"));
  assert.equal(state.online, true);
  assert.equal(state.catalogSource, "live");
});
