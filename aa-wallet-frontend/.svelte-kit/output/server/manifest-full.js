export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["robots.txt"]),
	mimeTypes: {".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.D1elLnUF.js",app:"_app/immutable/entry/app.J00NBXXB.js",imports:["_app/immutable/entry/start.D1elLnUF.js","_app/immutable/chunks/D-cVyarN.js","_app/immutable/chunks/BSaqiTP_.js","_app/immutable/chunks/Dmk5vVOr.js","_app/immutable/entry/app.J00NBXXB.js","_app/immutable/chunks/DSi-mmah.js","_app/immutable/chunks/BSaqiTP_.js","_app/immutable/chunks/DDYpejvz.js","_app/immutable/chunks/Dmk5vVOr.js","_app/immutable/chunks/B6sbQzxP.js","_app/immutable/chunks/Ce3tKq2q.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
