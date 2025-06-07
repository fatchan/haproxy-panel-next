// js version of https://github.com/timolins/react-hot-toast/issues/31#issuecomment-2084653008
import React, { useEffect } from 'react';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';

function useMaxToasts (max) {
	const { toasts } = useToasterStore();
	useEffect(() => {
		toasts
			.filter((t) => t.visible)
			.filter((_, i) => i >= max)
			.forEach((t) => toast.dismiss(t.id));
	}, [toasts, max]);
}

export function ToasterWithMax ({ max = 3, ...props }) {
	useMaxToasts(max);
	return <Toaster {...props} />;
}
