const MapPage = (a) => {
return (
  <div>
    <p>page {a.id}</p>
  </div>)
};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
  return { props: res.locals.props || {} };
}

export default MapPage;
