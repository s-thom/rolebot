const fs = require('fs');
const Discord = require('discord.js');
const pkg = require('./package.json');

const { Message, RichEmbed, Client } = Discord;
const client = new Client();

process.on('unhandledRejection', (r, p) => {
  console.log(r);
});

function embedify(message, color = '#F8F8F8') {
  const embed = new RichEmbed()
    .setColor(color)
    .setDescription(message);

  return embed;
}

async function send(target, message) {
  let m;
  if (message instanceof Promise) {
    m = await message;
  } else {
    m = message;
  }
  let embed;
  if (m instanceof RichEmbed) {
    embed = m;
  } else {
    embed = embedify(m);
  }

  console.log(`< ${embed.description}`);

  return target.send('', { embed })
    .catch((err) => {
      console.error(err);
    });
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

  if (conf.servers[msg.guild.id].allowed.indexOf(text) === -1) {
    return `${text} is not an allowed role. use \`>list\` to view the roles`;
  }

  const { roles } = client.guilds.get(msg.guild.id);
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

  if (conf.servers[msg.guild.id].allowed.indexOf(text) === -1) {
    return `${text} is not an allowed role. use \`>list\` to view the roles`;
  }

  const { roles } = client.guilds.get(msg.guild.id);
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

  const isOverlord = conf.overlords.indexOf(msg.author.id) > -1;
  const isAdmin = msg.member.hasPermission('MANAGE_GUILD');
  if (!(isOverlord || isAdmin)) {
    return 'you do not have permission to allow new roles';
  }

  if (!conf.servers[msg.guild.id]) {
    conf.servers[msg.guild.id] = {
      allowed: [],
    };
  }

  if (conf.servers[msg.guild.id].allowed.indexOf(text) > -1) {
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

  const isOverlord = conf.overlords.indexOf(msg.author.id) > -1;
  const isAdmin = msg.member.hasPermission('MANAGE_GUILD');
  if (!(isOverlord || isAdmin)) {
    return 'you do not have permission to disallow roles';
  }

  if (!conf.servers[msg.guild.id]) {
    return 'server not set up';
  }
  if (!conf.servers[msg.guild.id].allowed.length) {
    return 'no roles have been added. a server admin needs to use `>allow`';
  }

  if (conf.servers[msg.guild.id].allowed.indexOf(text) === -1) {
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
    '[source code](https://github.com/sthom.kiwi/rolebot)',
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

async function doFace() {
  const conf = await readConfig();

  if (!conf.faces) {
    return 'whoever wrote this bot did a bad job and hasn\'t configured it correctly';
  }

  return conf.faces[Math.floor(Math.random() * conf.faces.length)];
}

client.on('ready', () => {
  client.user.setPresence({
    game: {
      name: '>help',
    },
  });
  console.log('logged in');
});

client.on('message', (msg) => {
  const match = msg.content.match(/^>(\S+)(?: (.*))?/);
  if (!match) {
    return;
  }

  console.log(`> ${msg.author.username}: ${msg.content}`);

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
    case '.<':
    case '_<':
    case 'o<':
    case '3<':
    case '*<':
    case '->':
    case '_>':
    case '.>':
      send(msg.channel, doFace());
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
