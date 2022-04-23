"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
require("dotenv/config");
const config_json_1 = require("./config.json");
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES] });
let prefix = "!";
const commandResolve = (command) => prefix + command;
client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand())
        return;
    if (interaction.commandName === "ping") {
        await interaction.reply('Pong!');
    }
});
client.on('messageCreate', async (message) => {
    if (message.content === commandResolve('qq')) {
        await message.reply('Pong!');
    }
});
client.login(config_json_1.token);
