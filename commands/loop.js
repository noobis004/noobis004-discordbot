const { SlashCommandBuilder } = require('@discordjs/builders');
const { loop } = require('./music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription('Loops the current queue'),
    async execute(interaction) {
        loop(interaction);
    },
};