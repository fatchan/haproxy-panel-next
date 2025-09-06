import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import MapRow from './MapRow';
import MapFormFields from './MapFormFields';
import ErrorAlert from './ErrorAlert';
import InfoAlert from './InfoAlert';
import SearchFilter from './SearchFilter';
import * as API from '../api';
import { useRouter } from 'next/router';
import { fMap } from '../util';

const mapAlerts = {
  ddos: <>Toggle an interstitial bot-check page per domain or domain/path. Recommended if you are frequently targeted by attacks.</>,
  ddos_config: <>Set the parameters of the bot check for a domain or domain/path.</>,
  blockedasn: <>Block entire networks containing multiple netblocks. Visit <a target='_blank' rel='noreferrer' href='https://bgp.tools'>bgp.tools</a> to search ASNs, or find the ASN of an IP or netblock.</>,
  maintenance: <>Display a page letting your visitors know your site is undergoing maintenance or downtime.</>,
  images: <>Choose a custom remote URL for images embedded in edge pages e.g. bot-check, maintenance, etc.</>,
  css: <>Create custom CSS to change the style of edge pages e.g. bot-check, maintenance, etc.</>,
  blockedcc: <>Blocked countries based on geoip (<a target='_blank' rel='noreferrer' href='https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes'>ISO 3166-1 alpha-2 country codes</a>).</>,
  redirect: <>Redirect all requests from a domain to another domain or domain/path e.g. &quot;www.example.com&quot; -&gt; &quot;example.com&quot; or &quot;example.com/something&quot;.</>,
  rewrite: <>Rewrite domain/path to another path e.g. &quot;example.com/blog&quot; -&gt; &quot;example.com/new-blog&quot;.</>,
  whitelist: <>Whitelist an IP or netblock from bot-check and maintenance modes for your domains.</>,
};

export default function MapContainer({ mapName, initialData = {}, minimal }) {

  const router = useRouter();
  const [state, _setState] = useState(initialData);
  const [error, _setError] = useState();
  const [filter, setFilter] = useState('');
  const [editValue, setEditValue] = useState({});
  const [loading, setLoading] = useState();

  const setState = (newState) => {
    _setState(newState);
    setLoading(false);
    _setError(null);
  };

  const setError = (err) => {
    _setError(err);
    setLoading(false);
  };

  const { user, mapValueNames, mapInfo, map, csrf, showValues, mapNotes } = state || {};

  useEffect(() => {
    // fetch if missing or different map
    if (!state.map || (state.mapInfo && state.mapInfo.name !== mapName)) {
      setLoading(true);
      API.getMap(mapName, setState, setError, router);
    }
  }, [state.map, mapName, router]);

  const handleFieldChange = (field, newValue) => {
    setEditValue(prev => ({ ...prev, [field]: newValue }));
  };

  async function addToMap(e) {
    e.preventDefault();
    await API.addToMap(mapName, { _csrf: csrf, ...editValue }, setState, setError, minimal ? null : router);
    await API.getMap(mapName, setState, setError, router);
    e.target.reset();
    setEditValue({});
  };

  async function deleteFromMap(_csrf, key) {
    await API.deleteFromMap(mapName, { _csrf, key }, setState, setError, minimal ? null : router);
    await API.getMap(mapName, setState, setError, router);
  };

  const mapRows = map
    ?.filter(row => {
      const rowValue = typeof row.value === 'object' ? Object.values(row.value) : row.value;
      return row.key.includes(filter) || (rowValue && rowValue.includes && rowValue.includes(filter));
    })
    ?.map((row, i) => (
      <MapRow
        key={`${i}_${JSON.stringify(row)}`}
        row={row}
        name={fMap[mapName].name}
        csrf={csrf}
        showValues={showValues}
        mapValueNames={mapValueNames}
        onDeleteSubmit={deleteFromMap}
        mapNote={mapNotes && mapNotes[row.key]}
        showNote={fMap[mapName].showAllColumns}
        columnKeys={fMap[mapName].columnKeys}
        setError={setError}
        user={user}
      />
    ));


  return (<>

    {!minimal && <>
      <Head><title>{fMap[mapName].fname}</title></Head>
      <h5 className="fw-bold">{fMap[mapName].fname}:</h5>
      <InfoAlert>{mapAlerts[fMap[mapName].name]}</InfoAlert>
      <SearchFilter filter={filter} setFilter={setFilter} />
    </>}

    {error && <ErrorAlert error={error} />}

    <div className={`w-100 table-responsive ${minimal ? 'minimal-border' : 'round-border'}`}>
      <form onSubmit={addToMap} className="d-flex">
        <table className="table text-nowrap mb-0">
          {loading
            ? (
              <div className="d-flex flex-column">
                <div className="text-center mb-4">
                  <span className="spinner-border mt-5" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </span>
                </div>
              </div>
            ) : (
              <tbody>
                {!minimal && <tr>
                  <th style={{ width: 0 }} />
                  <th>{fMap[mapName].columnNames?.[0] || ''}</th>
                  {(showValues === true || fMap[mapName].showAllColumns === true) &&
                    fMap[mapName].columnNames?.slice(1)?.map((x, mci) => <th key={`mci_${mci}`}>{x}</th>)}
                </tr>}

                {mapRows}

                <tr className="align-middle">
                  <MapFormFields
                    map={map}
                    formType="add"
                    mapName={fMap[mapName].name}
                    mapValueNames={mapValueNames}
                    user={user}
                    editValue={editValue}
                    handleFieldChange={handleFieldChange}
                  />
                </tr>
              </tbody>
            )}
        </table>
      </form>
    </div>

    {error && <span className="mx-2"><ErrorAlert error={error} /></span>}
  </>);
}

