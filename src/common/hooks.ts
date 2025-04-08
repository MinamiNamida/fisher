import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { type RootState, type AppDispatch, store } from '../app/store'

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const getState = store.getState
