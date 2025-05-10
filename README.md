# Basedflare (haproxy-protection) control panel

🚨 This project is a work-in-progress, no instructions or help is provided whatsoever.

Provides a web-based control panel to conveniently manage clusters of [basedflare](https://gitgud.io/fatchan/haproxy-protection) servers.

##### Features:
- Manage DNS & domains.
- Manage backend server mappings
- Supports multiple backends per domain with round-robin load balancing
- Supports setting geo rotes to select the closest backend to the current edge
- HTTPS certificates w/ letsencrypt (DNS challenge), and automatic renewal
- Local private CA and page to sign CSR's for proper origin ssl validation
- IP/subnet/ASN blacklist
- IP/subnet whitelist
- Redirects and rewrites url to a different domain+path
- Manage protection modes and settings on a per-domain or domain+path basis
- Manage "maintenance" mode, shows a maintenance page to visitors while a backend is down
- Global override for protection mode, to quickly enable for all domains
- Customise CSS and images for bot-check pages per domain
- API keys and documentation

##### Extra features (not specific to basedflare/haproxy-protection):
- Ability to send BAN and PURGE requests for clearing cache if your HAProxy nodes are coupled with Varnish
- Statistics page with server and backend-level breakdowns based on haproxy stats socket data, backed by influxdb
- Video livestreaming integration with [ovenmediaengine](https://airensoft.gitbook.io/ovenmediaengine/)
- Automated invoicing and crypto payment gateway integration with [shkeeper](https://github.com/vsys-host/shkeeper.io)

## License
GNU AGPLv3, see [LICENSE](LICENSE).

#### Screenshots

![screenshot](img/screenshot.png "account page")

## For generous people

Bitcoin (BTC): [`bc1q4elrlz5puak4m9xy3hfvmpempnpqpu95v8s9m6`](bitcoin:bc1q4elrlz5puak4m9xy3hfvmpempnpqpu95v8s9m6)

Monero (XMR): [`89J9DXPLUBr5HjNDNZTEo4WYMFTouSsGjUjBnUCCUxJGUirthnii4naZ8JafdnmhPe4NP1nkWsgcK82Uga7X515nNR1isuh`](monero:89J9DXPLUBr5HjNDNZTEo4WYMFTouSsGjUjBnUCCUxJGUirthnii4naZ8JafdnmhPe4NP1nkWsgcK82Uga7X515nNR1isuh)
