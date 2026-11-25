import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { probeConnection } from "./connection-service.js";

export const checkConnection = createAsyncThunk("connectivity/check", async (_, { signal }) => {
  await probeConnection(signal);
});

const connectivitySlice = createSlice({
  name: "connectivity",
  initialState: {
    online: globalThis.navigator?.onLine !== false,
    check: "idle",
    requestId: null,
    catalogSource: "unknown",
  },
  reducers: {
    disconnected(state) {
      state.online = false;
      state.check = "idle";
      state.requestId = null;
    },
    catalogSourceChanged(state, { payload }) {
      state.catalogSource = payload;
      if (payload === "live") {
        state.online = true;
        state.requestId = null;
        state.check = "success";
      }
    },
  },
  extraReducers: (builder) => builder
    .addCase(checkConnection.pending, (state, action) => {
      state.requestId = action.meta.requestId;
      state.check = "loading";
    })
    .addCase(checkConnection.fulfilled, (state, action) => {
      if (state.requestId !== action.meta.requestId) return;
      state.requestId = null;
      state.online = true;
      state.check = "success";
    })
    .addCase(checkConnection.rejected, (state, action) => {
      if (state.requestId !== action.meta.requestId) return;
      state.requestId = null;
      if (action.meta.aborted) {
        state.check = "idle";
        return;
      }
      state.online = false;
      state.check = "error";
    }),
});

export const { disconnected, catalogSourceChanged } = connectivitySlice.actions;
export const selectConnectivity = (state) => state.connectivity;
export default connectivitySlice.reducer;
