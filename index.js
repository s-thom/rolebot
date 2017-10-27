const Discord = require('discord.js');
const config = require('./config.json');

const client = new Discord.Client();

client.on('ready', () => {
  console.log('logged in');
});

client.on('message', (msg) => {
  // TODO
});

client.login(config.token);
