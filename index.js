const Discord = require('discord.js');
const config = require('./config.json');

const client = new Discord.Client();

function embedify(message, color = '#F8F8F8') {
  const embed = new Discord.RichEmbed()
    .setColor(color)
    .setDescription(message);

  return embed;
}

function send(target, message) {
  let embed;
  if (message instanceof Discord.RichEmbed) {
    embed = message;
  } else {
    embed = embedify(message);
  }

  target.send('', { embed });
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
      // TODO
      break;
    case 'join':
      // TODO
      break;
    case 'leave':
      // TODO
      break;
    case 'allow':
      // TODO
      break;
    case 'disallow':
      // TODO
      break;

    default:
      send(msg.channel, 'that\'s not a command');
      break;
  }
});

client.login(config.token);
