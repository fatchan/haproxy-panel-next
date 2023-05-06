module.exports = {
	apps : [
		{
			name: "basedflare",
			script: "./server.js",
			watch: true,
			instances : "max",
			exec_mode : "cluster",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
			}
		},
		{
			name: "stats-pusher",
			script: "./influxdb.js",
			watch: true,
			instances : "1",
			exec_mode : "fork",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
			}
		}
	]
}
