const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'stream-global.bfcdn.host',
				port: '',
				pathname: '/thumb/**'
			},
		]
	}
};

export default nextConfig;
