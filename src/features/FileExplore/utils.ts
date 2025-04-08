import { produce} from "immer";
import { FileEntry } from "./fileExploreSlice";
import { FlatForest, getDescendantsFromFlatForest, moveNodeFromFlatForest } from "./tree";


/*======FileEntry Function======*/

export const compareFile = (
  a: FileEntry,
  b: FileEntry
) => {
  if (a.file_type === 'directory' && b.file_type === 'file') return -1;
  if (b.file_type === 'directory' && a.file_type === 'file') return 1;
  return a.name.localeCompare(b.name);
}

export const renameFile = (
  file: FileEntry,
  newName: string,
  newPath: string,
) => produce(file, draft => {
  draft.name = newName;
  draft.path = newPath;
})

export const newFile = ({
  name,
  path,
  file_type,
}: FileEntry) => {
  const fileEntry : FileEntry = {
    name, path, file_type,
  }
  return fileEntry
}

export const moveFile = (
  tree: FlatForest<FileEntry>,
  nodeId: string,
  new_path: string,
  parentId: string | null,
) => {
  const newTree = produce(tree, draft => {
    const old_path = draft.find(node => node.id === nodeId)?.data.path;
    if (!old_path) return []
    const descendant = new Set(getDescendantsFromFlatForest(tree, nodeId));
    draft.forEach(node => descendant.has(node.id)
      ? node.data.path = node.data.path.replace(old_path, new_path) 
      : null)
  })

  return moveNodeFromFlatForest(newTree, nodeId, parentId)
}
