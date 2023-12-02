#!/bin.bash
wget -O asn-ipv4.csv https://cdn.jsdelivr.net/npm/@ip-location-db/asn/asn-ipv4.csv
wget -O asn-ipv6.csv https://cdn.jsdelivr.net/npm/@ip-location-db/asn/asn-ipv6.csv
cat asn-ipv* | cut -d ',' -f 3- | sort | uniq > asn.map
rm *.csv
