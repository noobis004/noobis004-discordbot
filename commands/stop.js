const { SlashCommandBuilder } = require('@discordjs/builders');
const { stop } = require('./music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops the music'),
    async execute(interaction) {
        stop(interaction);
    },
};