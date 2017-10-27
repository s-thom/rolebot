const fs = require('fs');
const Discord = require('discord.js');
const pkg = require('./package.json');

const { Message, RichEmbed, Client } = Discord;
const client = new Client();

function embedify(message, color = '#F8F8F8') {
  const embed = new RichEmbed()
    .setColor(color)
    .setDescription(message);

  return embed;
}

function send(target, message) {
  let embed;
  if (message instanceof RichEmbed) {
    embed = message;
  } else {
    embed = embedify(message);
  }

  target.send('', { embed });
}

function readConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile('./config.json', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
  })
    .then(JSON.parse);
}

function writeConfig(conf) {
  return new Promise((resolve, reject) => {
    fs.writeFile('./config.json', JSON.stringify(conf, null, 2), (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

async function doList(msg) {
  const conf = await readConfig();

  if (!conf.servers[msg.guild.id]) {
    return 'server not set up';
  }
  if (!conf.servers[msg.guild.id].allowed.length) {
    return 'no roles have been added. a server admin needs to use `>allow`';
  }

  return [
    '**allowed roles**',
    '*use `>join` to add one*',
    '',
    ...conf.servers[msg.guild.id].allowed,
  ].join('\n');
}

/**
 * @param {Message} msg
 * @param {string} text
 * @returns
 */
async function doJoin(msg, text) {
  if (!text) {
    return 'no role name given';
  }

  const conf = await readConfig();

  if (!conf.servers[msg.guild.id]) {
    return 'server not set up';
  }
  if (!conf.servers[msg.guild.id].allowed.length) {
    return 'no roles have been added. a server admin needs to use `>allow`';
  }

  if (!conf.servers[msg.guild.id].allowed.includes(text)) {
    return `${text} is not an allowed role. use \`>list\` to view the roles`;
  }

  const { roles } = client.guilds.find(msg.guild.id);
  const role = roles.find('name', text);

  if (!role) {
    return `unable to find role ${text}`;
  }

  return msg.member
    .addRole(role, 'because they said so')
    .then(
      () => 'added role',
      (err) => {
        console.error(err);
        return 'unable to set role. does the bot have the permission?';
      },
    );
}

/**
 * @param {Message} msg
 * @param {string} text
 * @returns
 */
async function doLeave(msg, text) {
  if (!text) {
    return 'no role name given';
  }

  const conf = await readConfig();

  if (!conf.servers[msg.guild.id]) {
    return 'server not set up';
  }
  if (!conf.servers[msg.guild.id].allowed.length) {
    return 'no roles have been added. a server admin needs to use `>allow`';
  }

  if (!conf.servers[msg.guild.id].allowed.includes(text)) {
    return `${text} is not an allowed role. use \`>list\` to view the roles`;
  }

  const { roles } = client.guilds.find(msg.guild.id);
  const role = roles.find('name', text);

  if (!role) {
    return `unable to find role ${text}`;
  }

  return msg.member
    .removeRole(role, 'because they said so')
    .then(
      () => 'removed role',
      (err) => {
        console.error(err);
        return 'unable to remove role. does the bot have the permission?';
      },
    );
}

/**
 * @param {Message} msg
 * @param {string} text
 * @returns
 */
async function doAllow(msg, text) {
  if (!text) {
    return 'no role name given';
  }

  const conf = await readConfig();

  if (!conf.servers[msg.guild.id]) {
    return 'server not set up';
  }
  if (!conf.servers[msg.guild.id].allowed.length) {
    return 'no roles have been added. a server admin needs to use `>allow`';
  }

  if (conf.servers[msg.guild.id].allowed.includes(text)) {
    return `${text} has already been added`;
  }

  conf.servers[msg.guild.id].allowed.push(text);

  return writeConfig(conf)
    .then(
      () => `allowed ${text}`,
      (err) => {
        console.error(err);
        return 'unable to save changes';
      },
    );
}

/**
 * @param {Message} msg
 * @param {string} text
 * @returns
 */
async function doDisallow(msg, text) {
  if (!text) {
    return 'no role name given';
  }

  const conf = await readConfig();

  if (!conf.servers[msg.guild.id]) {
    return 'server not set up';
  }
  if (!conf.servers[msg.guild.id].allowed.length) {
    return 'no roles have been added. a server admin needs to use `>allow`';
  }

  if (!conf.servers[msg.guild.id].allowed.includes(text)) {
    return `${text} wasn't in the list, so i guess it's removed?`;
  }

  conf.servers[msg.guild.id].allowed = conf.servers[msg.guild.id].allowed.filter(r => r !== text);

  return writeConfig(conf)
    .then(
      () => `disallowed ${text}`,
      (err) => {
        console.error(err);
        return 'unable to save changes';
      },
    );
}

async function doHelp() {
  return [
    `rolebot v${pkg.version}`,
    '',
    'available commands:',
    '`>list`: list roles you can add/remove using this bot',
    '`>join <role>`: join a role, where `<role>` is the name of the role to add',
    '`>leave <role>`: the opposite of `>join`',
    'for server admins only:',
    '`>allow <role>`: allows a role to be added/removed',
    '`>disallow <role>`: the opposite of `>allow`',
  ].join('\n');
}

client.on('ready', () => {
  console.log('logged in');
});

client.on('message', (msg) => {
  const match = msg.content.match(/>(\S+)(?: (.*))?/);
  if (!match) {
    return;
  }

  // There's a command-like string, so check if in server
  if (!msg.guild) {
    send(msg.author, 'you need to be in a server to set roles');
  }

  switch (match[1]) {
    case 'list':
      send(msg.channel, doList(msg));
      break;
    case 'join':
      send(msg.channel, doJoin(msg, match[2]));
      break;
    case 'leave':
      send(msg.channel, doLeave(msg, match[2]));
      break;
    case 'allow':
      send(msg.channel, doAllow(msg, match[2]));
      break;
    case 'disallow':
      send(msg.channel, doDisallow(msg, match[2]));
      break;
    case 'help':
      send(msg.author, doHelp());
      break;
    default:
      send(msg.channel, 'that\'s not a command');
      break;
  }
});

readConfig()
  .then((config) => {
    client.login(config.token);
  }, (err) => {
    console.error('unable to read config');
    console.error(err);
  });
