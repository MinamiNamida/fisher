import { getState, useAppSelector } from "../../common/hooks";

export const useFileNode = (id: string) => 
  useAppSelector((state) => state.fileExplore.forest?.find(node => node.id === id))
export const getFileNode = (id: string) => getState().fileExplore.forest?.find(node => node.id === id)
