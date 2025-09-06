import countries from 'i18n-iso-countries';

export { countries };

export const countryMap = countries.getAlpha2Codes();

export const continentMap = {
	'XX': 'All',
	'NA': 'North America',
	'SA': 'South America',
	'EU': 'Europe',
	'AS': 'Asia',
	'OC': 'Oceania',
	'AF': 'Africa',
	'AN': 'Antarctica',
};

export const continentOptions = Object.entries(continentMap)
	.map(([value, label]) => ({ value, label }));
