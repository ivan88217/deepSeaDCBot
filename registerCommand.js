"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const config_json_1 = require("./config.json");
const commands = [{
        name: 'ping',
        description: 'Replies with Pong!'
    }];
const rest = new rest_1.REST({ version: '9' }).setToken('token');
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(v9_1.Routes.applicationGuildCommands(config_json_1.clientId, config_json_1.serverId), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    }
    catch (error) {
        console.error(error);
    }
})();
