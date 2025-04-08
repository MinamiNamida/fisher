import { configureStore } from "@reduxjs/toolkit";
import { fileExploreSlice } from "../features/FileExplore/fileExploreSlice";
import { markdownEditorSlice } from "../features/Editor/editorSlice";

export const store = configureStore({
  reducer: {
    fileExplore: fileExploreSlice.reducer,
    markdownEditor: markdownEditorSlice.reducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch