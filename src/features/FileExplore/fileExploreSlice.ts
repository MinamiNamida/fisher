import { createSlice } from '@reduxjs/toolkit';
import { addNodeFromFlatForest, assignNestTreeIds, flattenNestTree, sortFlatForest, removeNodeFromFlatForest } from './tree';
import { FlatForest,} from './tree';
import { compareFile, moveFile, newFile } from './utils';
import { fetchDeleteFile, fetchGetFileTree, fetchMoveFile, fetchNewFile, fetchRename } from './fetches';

export type FileEntryType = 'directory' | 'file';

export interface FileEntry {
  name: string;
  path: string;
  file_type: FileEntryType;
}



export interface FileTreeState {
  readonly path: string | null;
  readonly forest : FlatForest<FileEntry> | null;
  readonly status: 'idle' | 'loading' | 'succeeded' | 'failed';
  readonly error: string | null;
}

export const initialState: FileTreeState = {
  path: null,
  forest: null,
  status: 'idle',
  error: null,
};

export const fileExploreSlice = createSlice({
  name: 'fileExplore',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGetFileTree.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGetFileTree.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          const {tree, path} = action.payload;
          const flatTree = sortFlatForest(flattenNestTree(assignNestTreeIds(tree), null, 0), compareFile);
          state.forest = flatTree;
          state.path = path;
        }
      })
      .addCase(fetchGetFileTree.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unknown error';
      })
      .addCase(fetchRename.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRename.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (!action.payload) return
        const {new_name, new_path, id} = action.payload;
        const node = state.forest?.find(node => node.id === id)
        if (!node) return
        node.data.name = new_name;
        node.data.path = new_path;
        state.error = null;
      })
      .addCase(fetchRename.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unknown error';
      })
      .addCase(fetchNewFile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNewFile.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.error = null
        if (!action.payload?.parent || !state.forest) return;
        const { parent, file_name, file_path, file_type } = action.payload;
        const fileEntry = newFile({name: file_name, path: file_path, file_type})
        const newTree = addNodeFromFlatForest(state.forest, fileEntry, parent)
        // state.forest = sortFlatForest(newTree, compareFile)
        state.forest = newTree
      })
      .addCase(fetchNewFile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unknown error';
      })
      .addCase(fetchDeleteFile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDeleteFile.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.error = null;
        const forest = state.forest;
        if (action.payload && forest) {
          const { id } = action.payload;
          state.forest = removeNodeFromFlatForest(forest, id);
        }
      })
      .addCase(fetchDeleteFile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unknown error';
      })
      .addCase(fetchMoveFile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMoveFile.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.error = null;
        const {forest} = state
        if (action.payload && forest) {
          const { id, parent_id, new_path } = action.payload;
          // state.forest = sortFlatForest(moveFile(forest, id, new_path, parent_id), compareFile)
          state.forest = moveFile(forest, id, new_path, parent_id), compareFile
        }
      })
      .addCase(fetchMoveFile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Unknown error';
      })
  },
});

/*====== Useful Hook ======*/


export default fileExploreSlice.reducer;