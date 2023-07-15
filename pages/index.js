import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function Index() {
	return (<>
		<Head>
			<title>BasedFlare</title>
		</Head>

		<span className="d-flex flex-column align-items-center mt-5 pt-5">
			<Link href="#!">
				<a className="d-flex mb-3 text-decoration-none align-items-center">
					<Image src="/favicon.ico" layout="fixed" width="24" height="24" alt=" " />
					<span className="mx-2 fs-4 text-decoration-none">BasedFlare</span>
				</a>
			</Link>
			<span className="d-flex">
				<div className="me-2">
					<Link href='/account'>
						<a className="btn btn-primary">
							<i className="bi-person-square pe-none me-2" width="16" height="16" />
							Account
						</a>
					</Link>
				</div>
				<div>
					<Link href='/login'>
						<a className="btn btn-primary">
							<i className="bi-door-closed pe-none me-2" width="16" height="16" />
							Login
						</a>
					</Link>
				</div>
			</span>
		</span>

	</>);
}
