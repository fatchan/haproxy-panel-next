import { createContext, useReducer } from 'react';
import reducer from './GlobalReducer.js';

export const GlobalContext = createContext();

const initialState = {};

export default function GlobalProvider(props) {
	const [state, dispatch] = useReducer(reducer, initialState);
	return (
		<GlobalContext.Provider value={[state, dispatch]}>
			{props.children}
		</GlobalContext.Provider>
	);
}
