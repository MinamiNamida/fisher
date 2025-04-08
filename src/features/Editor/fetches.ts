import { createAsyncThunk } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";

export interface RespondOpenFile {
  path: string,
  content: string,
}

export const fetchOpenFile = createAsyncThunk(
  'markdownEditor/openFile',
  async (params: { path: string }) => {
    try {
      return await invoke<RespondOpenFile>('open_file', params);
    } catch (error) {
      console.log(error);
      return null;
    }
  }
)