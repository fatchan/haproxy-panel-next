module.exports = {
	apps : [
		{
			name: "basedflare",
			script: "./server.js",
			log_date_format: "YYYY-MM-DD HH:mm:ss",
			instances : "max",
			exec_mode : "cluster",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
				"DEBUG": "express:router",
			}
		},
		{
			name: "stats-main",
			script: "./stats/main.js",
			log_date_format: "YYYY-MM-DD HH:mm:ss",
			instances : "1",
			exec_mode : "fork",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
			}
		},
		{
			name: "stats-worker",
			script: "./stats/worker.js",
			log_date_format: "YYYY-MM-DD HH:mm:ss",
			instances : "2",
			exec_mode : "fork",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
			}
		},
		{
			name: "healthcheck-main",
			script: "./healthcheck/main.js",
			log_date_format: "YYYY-MM-DD HH:mm:ss",
			instances : "1",
			exec_mode : "fork",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
			}
		},
		{
			name: "healthcheck-worker",
			script: "./healthcheck/worker.js",
			log_date_format: "YYYY-MM-DD HH:mm:ss",
			instances : "6",
			exec_mode : "fork",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
			}
		},
		{
			name: "loki-pruner",
			script: "./loki/main.js",
			log_date_format: "YYYY-MM-DD HH:mm:ss",
			instances : "1",
			exec_mode : "fork",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
			}
		},
		{
			name: "autorenew",
			script: "./autorenew/main.js",
			log_date_format: "YYYY-MM-DD HH:mm:ss",
			instances : "1",
			exec_mode : "fork",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
			}
		},
		{
			name: "sync-main",
			script: "./sync/main.js",
			log_date_format: "YYYY-MM-DD HH:mm:ss",
			instances : "1",
			exec_mode : "fork",
			env: {
				"NODE_ENV": "development"
			},
			env_production: {
				"NODE_ENV": "production",
			}
		},
	]
}
