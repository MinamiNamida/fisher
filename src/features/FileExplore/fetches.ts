import { createAsyncThunk } from "@reduxjs/toolkit";
import { FileEntry, FileEntryType } from "./fileExploreSlice";
import { NestNode } from "./tree";
import { invoke } from "@tauri-apps/api/core";
import { getFileNode } from "./hooks";

export interface RespondRename {
  readonly id: string,
  readonly old_path: string,
  readonly old_name: string,
  readonly new_path: string,
  readonly new_name: string,
}

export interface RespondNewFile {
  readonly parent: string,
  readonly file_name: string,
  readonly file_path: string,
  readonly file_type: FileEntryType,
}

export interface RespondMoveFile {
  readonly id: string,
  readonly parent_id: string,
  readonly old_parent_path: string,
  readonly new_parent_path: string,
  readonly old_path: string,
  readonly new_path: string,
}

export interface RespondDeleteFile {
  readonly parent: string,
  readonly id: string,
  readonly path: string,
}

export interface RespondGetFileTree {
  readonly path: string,
  readonly tree: NestNode<FileEntry, never>
}

export const fetchGetFileTree = createAsyncThunk(
  'fileExplore/fetchGetFileTree',
  async (params: {path: string} ) => {
    try {
      const treeBase = await invoke<RespondGetFileTree>('get_file_tree', params);
      return treeBase
    } catch (error) {
      console.log(error);
      return null;
    }
  }
)

export const fetchRename = createAsyncThunk(
  'fileExplore/fetchRename',
  async (params: { id:string, oldPath: string, newName: string }) => {
    try {
      return await invoke<RespondRename>('rename', params);
    } catch (error) {
      console.log(error);
      return null;
    }
  }
)

export const fetchNewFile = createAsyncThunk(
  'fileExplore/fetchNewFile',
  async (params: { parent:string | null, filePath: string, fileType: FileEntryType }) => {
    try {
      return await invoke<RespondNewFile>('new_file', params);
    } catch (error) {
      console.log(error);
      return null;
    }
  }
)

export const fetchDeleteFile = createAsyncThunk(
  'fileExplore/fetchDeleteFile',
  async (params: { parent:string | null, id: string, path: string }) => {
    try {
      return await invoke<RespondDeleteFile>('delete_file', params);
    } catch (error) {
      console.log(error);
      return null;
    }
  }
)

export const fetchMoveFile = createAsyncThunk(
  'fileExplore/fetchMoveFile',
  async (params: {sourceId: string, targetId: string}) => {
    try {
      const {sourceId, targetId} = params;
      const source = getFileNode(sourceId);
      const target = getFileNode(targetId);
      if (!source || !target) return null;
      console.log(source.data.name, target.data.name)
      if (target.children.some(child => child === source.id)) return
      return await invoke<RespondMoveFile>('move_file', {
        id: source.id,
        parentId: target.id,
        oldPath: source.data.path,
        newParentPath: target.data.path,
      });
    } catch (error) {
      console.log(error);
      return null;
    }
  }
)