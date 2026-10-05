import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './store.ts'

// Typed versions of react-redux's hooks. Components use these instead of
// the plain useSelector and useDispatch:
// - useAppSelector already knows the shape of RootState, so
//   useAppSelector((state) => state.ui.sidebarCollapsed) is typed as boolean,
//   and a typo like state.ui.sidebarColapsed is a compile error.
// - useAppDispatch knows every action the store accepts.
// withTypes() sets the types once here, so no component has to repeat them.
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
