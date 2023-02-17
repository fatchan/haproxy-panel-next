# BasedFlare Control Panel

Work in progress. Not recommended for production deployment. No instructions or help provided whatsoever.

Internally uses [haproxy dataplaneapi](https://github.com/haproxytech/dataplaneapi/).
Intended for use with [haproxy-protection](https://gitgud.io/fatchan/haproxy-protection).

Provides a control panel interface to conveniently manage clusters (groups of identically configured) HAProxy servers. Can be used with a single server cluster. Uses haproxy runtime apis to update maps, acls, etc.

##### Features:
- List/add/remove clusters (server groups).
- List/add/remove domains for your account.
- Control allowed hosts for a cluster.
- Custom backend server IP and port per-domain.
- Override to toggle proof-of-work for whole cluster.
- IP or subnet blacklist. Supports ipv4 and ipv6.
- IP or subnet whitelist. Supports ipv4 and ipv6.
- Protection rules, choose bot protection mode "none" (whitelist), proof-of-work or hCaptcha. Can be domain-wide or a domain+path. Path overrides domain-wide.
- Maintenance mode, disables proxying for selected domains and serves an "under maintenance" page from haproxy.

##### Todo:
- Better Multi-user support (problems w/ ip whitelist and blacklist)
- Some kind of payment system
- SSL cert management, or letsencrypt integration
- More advanced rules and ability to allow/block/bot mode based on those rules.
