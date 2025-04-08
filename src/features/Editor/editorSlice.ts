import { createSlice } from '@reduxjs/toolkit';
import { fetchOpenFile } from './fetches';


export interface MarkdownEditorState {
  path: string | null;
  content: string | null;
  status: 'idle' | 'success' | 'failed' | 'pending';
  error: string | null;
}

export const initialState: MarkdownEditorState = {
  path: null,
  content: null,
  status: 'idle',
  error: null,
};

export const markdownEditorSlice = createSlice({
  name: 'markdownEditor',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOpenFile.fulfilled, (state, action) => {
        if (!action.payload) return 
        console.log(action.payload)
        state.status = 'success'
        state.path = action.payload.path;
        state.content = action.payload.content;
      })
      .addCase(fetchOpenFile.pending, (state) => {
        state.status = 'pending'
      })
      .addCase(fetchOpenFile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unknown error';
      })
  }
})

export default markdownEditorSlice.reducer
