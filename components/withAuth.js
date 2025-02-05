import { useEffect } from 'react';
import { useRouter } from 'next/router';

function withAuth(WrappedComponent) {
	return function WithAuth(props) {
		const router = useRouter();
		const { user } = props;
		console.log('props', props);
		useEffect(() => {
			if (!user) {
				router.push('/login');
			}
		}, [user, router]);

		if (!user) {
			return null;
		}

		return <WrappedComponent {...props} />;
	};
};

export default withAuth;

