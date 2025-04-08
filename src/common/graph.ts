import { produce, castDraft } from "immer";

export interface Node<T> {
  id: string,
  data: T,
}

export interface Edge<W> {
  id: string,
  weight: W,
  from: string,
  to: string,
}

export interface Graph<T, W> {
  nodes: Node<T>[];
  edges: Edge<W>[];
}

export const addNode = <T, W>(
  node: Node<T>
) => produce<Graph<T, W>>(draft => {
  draft.nodes.push(castDraft(node))
})

export const addNodes = <T, W>(
  nodes: Node<T>[],
) => (state: Graph<T, W>) => nodes.forEach(node => addNode(node)(state))

export const addEdge = <T, W>(
  edge: Edge<W>,
) => produce<Graph<T, W>>(draft => {
  draft.edges.push(castDraft(edge))
})

export const addEdges = <T, W>(
  edges: Edge<W>[],
) => (state: Graph<T, W>) => edges.forEach(edge => addEdge(edge)(state))


