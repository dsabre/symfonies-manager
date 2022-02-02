const inquirer            = require('inquirer');
const os                  = require("os");
const fs                  = require("fs");
const envFilepath         = '.env';
const dbFilepath          = 'db.json';
const {execSync}          = require("child_process");
const symfonyMajorVersion = parseInt(execSync('symfony -V |sed -r "s/\x1B\\[([0-9]{1,3}(;[0-9]{1,2})?)?[mGK]//g"').toString().trim().match(/(\d+\.\d+\.\d+)/)[1].trim().split('.')[0].trim());

const defaults = {
	PORT:                  7079,
	PROXY_FILE_PATH:       `/home/${os.userInfo().username}/.symfony${symfonyMajorVersion > 4 ? symfonyMajorVersion : ''}/proxy.json`,
	START_PROXY:           true,
	OPEN_DIR_COMMAND:      process.platform === 'linux' ? 'xdg-open %DIR%' : 'open %DIR%',
	OPEN_TERMINAL_COMMAND: process.platform === 'linux' ? 'gnome-terminal --working-directory=%DIR%' : 'open -a Terminal %DIR%'
};

// load current .env config file if exists
if (fs.existsSync(envFilepath)) {
	require('dotenv').config();

	defaults.PORT                  = parseInt(process.env.PORT);
	defaults.PROXY_FILE_PATH       = process.env.PROXY_FILE_PATH.trim();
	defaults.START_PROXY           = process.env.START_PROXY.trim() === 'true';
	defaults.OPEN_DIR_COMMAND      = process.env.OPEN_DIR_COMMAND.trim();
	defaults.OPEN_TERMINAL_COMMAND = process.env.OPEN_TERMINAL_COMMAND.trim();
}

// prepare questions
const questions = [
	{
		type:    'input',
		name:    'PORT',
		message: 'Port where Symfonies manager will run on:',
		default: defaults.PORT,
		validate(value) {
			if ((value + '').match(/^[\d]+$/)) {
				return true;
			}

			return 'Please enter a valid port number';
		}
	},
	{
		type:    'input',
		name:    'PROXY_FILE_PATH',
		message: 'Absolute path of your Symfony proxy.json file:',
		default: defaults.PROXY_FILE_PATH
	},
	{
		type:    'confirm',
		name:    'START_PROXY',
		message: 'Do you want to start Symfony proxy automatically on this manager start?',
		default: defaults.START_PROXY,
	},
	{
		type:    'input',
		name:    'OPEN_DIR_COMMAND',
		message: 'Command to open directory:',
		default: defaults.OPEN_DIR_COMMAND,
		validate(value) {
			if (value.trim() === '' || value.trim().includes('%DIR%')) {
				return true;
			}

			return 'Please include in your command the \'%DIR%\' variable';
		}
	},
	{
		type:    'input',
		name:    'OPEN_TERMINAL_COMMAND',
		message: 'Command to open terminal:',
		default: defaults.OPEN_TERMINAL_COMMAND,
		validate(value) {
			if (value.trim() === '' || value.trim().includes('%DIR%')) {
				return true;
			}

			return 'Please include in your command the \'%DIR%\' variable';
		}
	}
];

inquirer.prompt(questions).then(answers => {
	const config = [];

	Object.keys(answers).forEach(key => {
		config.push([key, `"${typeof answers[key] === 'string' ? answers[key].trim() : answers[key]}"`].join('='));
	});

	// write .env file
	fs.writeFileSync(envFilepath, config.join('\n'));

	// initialize db if not exists
	if (!fs.existsSync(dbFilepath)) {
		fs.writeFileSync(dbFilepath, JSON.stringify({symfonies: []}));
	}
});