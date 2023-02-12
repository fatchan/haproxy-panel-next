// reducer.js
export default function reducer(state, action) {
	//could do somethig na bit more smart than this
	switch (action.type) {
		case 'error':
			// Add error, keep existing state
			return { error: action.payload, ...state };
		case 'state':
			// Keep state, overwrite or add new values from payload, and null error
			return { ...state, ...action.payload, error: null };
		default:
			throw new Error();
	}
}
