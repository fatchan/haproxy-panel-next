import DnsEditRecordPage from './[zone]/[type].js';
export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale}) {
	return { props: res.locals.data };
}
export default DnsEditRecordPage;
