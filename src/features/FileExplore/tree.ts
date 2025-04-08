import { v4 as uuidv4 } from "uuid";
import { produce, castDraft, Draft } from "immer";

export interface NestNode<
  T,
  I extends string | never = never
> {
  readonly id : I extends string ? I : never;
  readonly data: T;
  readonly children: readonly NestNode<T, I>[];
}

export interface FlatNode<T> {
  readonly id : string;
  readonly data: T;
  readonly parent: string | null;
  readonly depth: number,
  readonly children: string[];
}

export type FlatForest<T> = FlatNode<T>[]
export type NestForest<T, I extends string | never = never> = NestNode<T, I>[]

/*======Tree Function======*/

export const assignNestTreeIds = <T>(
  tree: NestNode<T>,
): NestNode<T, string> => {
  const children: NestNode<T, string>[] = tree.children.map(assignNestTreeIds);
  const node: NestNode<T, string> = { ...tree, id: uuidv4(), children };
  return node;
}

export const assignNestForestIds = <T>(
  forest: NestForest<T>
): NestForest<T, string> => forest.map(assignNestTreeIds)

export const flattenNestTree = <T>(
  tree: NestNode<T, string>,
  parent: null|string = null,
  depth: number = 0
) => {
  const childrenId = tree.children.map(child => child.id);
  const children :FlatForest<T> = tree.children.flatMap(child => flattenNestTree(child, tree.id, depth+1));
  const node: FlatNode<T> = {
    ...tree,
    children: childrenId,
    depth,
    parent,
  }
  return [node, ...children]
}

export const flattenNestForest = <T>(
  forest: NestForest<T, string>,
) => forest.flatMap(tree => flattenNestTree(tree))


export const getRootNodeIdsFromFlatForest = <T>(
  forest: FlatForest<T>
) => forest.filter(node => node.parent === null).map(node => node.id)

export const getDescendantsFromFlatForest = <T>( 
  forest: FlatForest<T>, 
  rootId: string,
) => { 
  const rootNode = forest.find(node => node.id === rootId);
  const children : string[] = rootNode
  ? rootNode.children.flatMap(child => getDescendantsFromFlatForest(forest, child))
  : []
  return [rootId, ...children]
}

export const removeNodeFromFlatForest = <T>(
  forest: FlatForest<T>,
  nodeId: string,
) => {
  const descendants = new Set(getDescendantsFromFlatForest(forest, nodeId));
  return forest.filter(node => !descendants.has(node.id))
    .map(node => {
      const children = node.children.filter(childId => !descendants.has(childId))
      return {...node, children}
    })
}

export const addNodeFromFlatForest = <T>(
  forest: FlatForest<T>,
  data: T,
  parentId: string | null,
) => produce(forest, (draft) => {
  const parentNode = draft.find((node) => node.id === parentId)
  const depth = parentNode ? parentNode.depth + 1 : 0;
  const id = uuidv4();
  const node: Draft<FlatNode<T>> = {
    id,
    data: castDraft(data),
    parent: parentId,
    children: [],
    depth,
  };
  draft.push(node);
  if ( parentNode !== undefined ) {
    parentNode.children.push(id);
  }
});

export const moveNodeFromFlatForest = <T>(
  forest: FlatForest<T>,
  id: string,
  newParentId : string | null,
) => produce(forest, draft => {
  const moveNode = draft.find(node => node.id === id);
  const oldParentId = moveNode?.parent;
  const oldParentNode =  draft.find(node => node.id === oldParentId);
  if ( oldParentNode && moveNode ) {
    const descendant = new Set(getDescendantsFromFlatForest(forest, moveNode.id));
    const newParent = draft.find(node => node.id === newParentId);
    const depthDelta = newParent? newParent.depth - moveNode.depth + 1 : 0 - moveNode.depth + 1 ; 
    draft.forEach(node => descendant.has(node.id)? node.depth += depthDelta: null)
    oldParentNode.children = oldParentNode.children.filter(node => node !== id);
    moveNode.parent = newParentId;
    newParent ? newParent.children.push(id) : null;
  }
})

export const sortForFlatNode = <T>(
  fn: (a:T, b:T) => number
) => (c: FlatNode<T>, d: FlatNode<T>) => fn(c.data, d.data)

export const sortFlatForest = <T>(
  forest: FlatForest<T>,
  fn: (a: T, b: T) => number,
) => {
  const nodeMap = new Map<string, FlatNode<T>>();
  forest.forEach(node => nodeMap.set(node.id, node));

  const rootNodes = forest.filter(node => node.parent === null);
  rootNodes.sort(sortForFlatNode(fn));

  const sortedNodes: FlatForest<T> = [];

  const visitNode = (node: FlatNode<T>) => {
    sortedNodes.push(node);
    const children = node.children
      .map(id => nodeMap.get(id))
      .filter((child): child is FlatNode<T> => !!child)
      .sort(sortForFlatNode(fn));
    children.forEach(child => visitNode(child));
  };
  
  rootNodes.forEach(root => visitNode(root));
  return sortedNodes;
}

export const filterFlatForest = <T>(
  forest: FlatForest<T>,
  nodeId: string,
  fn: (a: T) => boolean,
) => {
  const node = forest.find(node => node.id === nodeId);
  if ( node !== undefined ){
    if ( !fn(node.data) ) {
      return [nodeId]
    } else {
      const children : string[] = node.children.flatMap(child => filterFlatForest(forest, child, fn));
      return [nodeId, ...children]
    }
  }
  return []
}

export const findNodeFromFlatForest = <T>(
  forest: FlatForest<T>,
  fn: (node: T) => boolean 
) =>  forest.find(node => fn(node.data))

export const filterNodeFromFlatForest = <T>(
  forest: FlatForest<T>,
  fn: (node: T) => boolean 
) => forest.filter(node => fn(node.data))

/*====== Nest Forest ====== */

export const foldNestTree = <T>(
  forest: FlatForest<T>,
  rootId: string,
) => {
  const rootNode = forest.find(node => node.id === rootId);
  if (!rootNode) return
  const nestNode : NestNode<T, string> = {
    id: rootId,
    data: rootNode.data,
    children: rootNode.children
      .map(childId => foldNestTree(forest, childId))
      .filter(node => node !== undefined)
  }
  return nestNode
}

export const foldNestForest = <T>(
  forest: FlatForest<T>,
) => {
  const roots = forest.filter(node => node.parent === null);
  return roots.flatMap(node => foldNestTree(forest, node.id)).filter(node => node !== undefined)
}

export const sortForNestNode = <T>(
  fn: (a:T, b:T) => number
) => (c: NestNode<T, string>, d: NestNode<T, string>) => fn(c.data, d.data)

export const sortNestTree = <T>(
  node: NestNode<T, string>,
  fn: (a: T, b: T) => number,
) => {
  const newNode : NestNode<T, string>= {
    ...node,
    children: [...node.children].sort(sortForNestNode(fn)).map(child => sortNestTree(child, fn))
  }
  return newNode
}

export const sortNestForest = <T>(
  forest : NestForest<T, string>,
  fn: (a: T, b: T) => number,
) => forest.map(node => sortNestTree(node, fn))
