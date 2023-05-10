module.exports = {
	apps : [
		{
			name: "basedflare",
			script: "./server.js",
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
