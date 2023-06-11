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
				"DEBUG": "express:router",
			}
		},
		{
			name: "stats-main",
			script: "./stats/main.js",
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
			instances : "2",
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
