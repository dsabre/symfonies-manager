const prompt      = require('prompt');
const os          = require('os');
const fs          = require('fs');
const envFilepath = '.env';
const dbFilepath = 'db.json';

const defaults = {
	PORT:            3999,
	PROXY_FILE_PATH: `/home/${os.userInfo().username}/.symfony5/proxy.json`,
	START_PROXY:     true
};

// load current .env config file if exists
if (fs.existsSync(envFilepath)) {
	require('dotenv').config();
	
	defaults.PORT            = parseInt(process.env.PORT);
	defaults.PROXY_FILE_PATH = process.env.PROXY_FILE_PATH.trim();
	defaults.START_PROXY     = process.env.START_PROXY.trim() === 'true';
}

const schema = {
	properties: {
		PORT:            {
			description: 'Port where Symfonies manager will run on',
			type:        'integer',
			pattern:     /^[\d]+$/,
			message:     'Port must be a number',
			default:     defaults.PORT,
			required:    true
		},
		PROXY_FILE_PATH: {
			description: 'Absolute path of your Symfony proxy.json file',
			type:        'string',
			default:     defaults.PROXY_FILE_PATH,
			required:    true
		},
		START_PROXY:     {
			description: 'Do you want to start Symfony proxy automatically on this manager start?',
			type:        'boolean',
			default:     defaults.START_PROXY
		}
	}
};

prompt.start();
prompt.get(schema, (err, result) => {
	const config = [];
	
	Object.keys(result).forEach(key => {
		config.push([key, result[key]].join('='));
	});
	
	fs.writeFileSync(envFilepath, config.join('\n'));
	
	if (!fs.existsSync(dbFilepath)) {
		fs.writeFileSync(dbFilepath, JSON.stringify({symfonies: []}));
	}
});