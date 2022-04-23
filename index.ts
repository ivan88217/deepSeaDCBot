import { Client, Intents } from 'discord.js'
import 'dotenv/config'
import { token } from './config.json'

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

let prefix = "!";

const commandResolver = (command: string) => prefix + command;

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === "ping") {
        await interaction.reply('Pong!');
    }
});

client.on('messageCreate', async message => {

    if (message.content === commandResolver('qq')) {
        await message.reply('Pong!');
    }
});


client.login(token);