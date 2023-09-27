import DnsEditRecordPage from './[zone]/[type].js';
export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: res.locals.data };
}
export default DnsEditRecordPage;
