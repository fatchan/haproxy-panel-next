export default function EditRecordPage({ domain, name, recordSet }) {
	return 'todo';
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
}
