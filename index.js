const fs          = require("fs");
const envFilepath = '.env';
const dbFilepath  = 'db.json';
let hasErrors     = false;

if (!fs.existsSync(envFilepath)) {
	console.error(`ERROR: ${envFilepath} file not found, probably you must run "npm run install" before`);
	hasErrors = true;
}

if (!fs.existsSync(dbFilepath)) {
	console.error(`ERROR: ${dbFilepath} file not found, probably you must run "npm run install" before`);
	hasErrors = true;
}

if (hasErrors) {
	process.exit(1);
}

// load .env config file
require('dotenv').config();

const _                = require('lodash');
const jsonServer       = require('json-server');
const {execSync, exec} = require("child_process");
const server           = jsonServer.create();
const router           = jsonServer.router(dbFilepath);
const middlewares      = jsonServer.defaults();
const serverUrl        = `http://localhost:${process.env.PORT}`;

server.use(middlewares);
server.use(router);

// start symfony proxy if required
if (process.env.START_PROXY.trim() === 'true') {
	exec("symfony proxy:start", (error, stdout, stderr) => {
		console.log(stdout);
	});
}

server.listen(process.env.PORT, () => {
	console.log(`JSON Server is running on ${serverUrl}`);
});

router.render = (req, res) => {
	if (req.method === 'GET' && req._parsedOriginalUrl.pathname === '/symfonies') {
		const symfonyProxy = JSON.parse(fs.readFileSync(process.env.PROXY_FILE_PATH, "utf8"));
		
		// LIST SYMFONIES
		res.locals.data = Object.keys(symfonyProxy.domains).map(symfony => {
			const saved          = _.find(res.locals.data, {symfony: symfony});
			const useHttps       = saved ? saved.useHttps : false;
			const directory      = symfonyProxy.domains[symfony];
			const startCommand   = Buffer.from(`symfony server:start --daemon --dir=${directory}`).toString('base64');
			const stopCommand    = Buffer.from(`symfony server:stop --dir=${directory}`).toString('base64');
			const detachCommand  = Buffer.from(`symfony proxy:domain:detach ${symfony}`).toString('base64');
			const openDirCommand = Buffer.from(`nautilus ${directory} &`).toString('base64');
			const statusInfo     = execSync(`symfony local:server:status --dir=${directory} |sed -r "s/\x1B\\[([0-9]{1,3}(;[0-9]{1,2})?)?[mGK]//g"`).toString().trim();
			const running        = statusInfo.includes('Listening on');
			
			let pid = null;
			if (running) {
				pid = parseInt(statusInfo.split('\n').map(s => s.trim()).filter(s => s.includes('PID'))[0].match(/PID (\d+)/)[1].trim());
			}
			
			return {
				symfony:   symfony,
				useHttps,
				directory,
				running,
				pid,
				url:       `http${useHttps ? 's' : ''}://${symfony}.${symfonyProxy.tld}`,
				shortcuts: saved ? saved.shortcuts : [],
				id:        saved ? saved.id : 0,
				favourite: saved ? saved.favourite : false,
				commands:  {
					start:   `${serverUrl}/execSync/${startCommand}`,
					stop:    `${serverUrl}/execSync/${stopCommand}`,
					openDir: `${serverUrl}/exec/${openDirCommand}`,
					detach:  `${serverUrl}/execSync/${detachCommand}`,
				}
			};
		});
	} else if (req.method === 'GET' && /^\/execSync\/.+$/.test(req._parsedOriginalUrl.pathname)) {
		const command = Buffer.from(req._parsedOriginalUrl.pathname.split('/')[2].trim(), 'base64').toString('ascii').trim();
		
		execSync(command);
		
		res.statusCode = 200;
	} else if (req.method === 'GET' && /^\/exec\/.+$/.test(req._parsedOriginalUrl.pathname)) {
		const command = Buffer.from(req._parsedOriginalUrl.pathname.split('/')[2].trim(), 'base64').toString('ascii').trim();
		
		exec(command);
		
		res.statusCode = 200;
	}
	
	res.jsonp(res.locals.data);
}