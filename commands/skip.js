const { SlashCommandBuilder } = require('@discordjs/builders');
const { skip } = require('./music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips the current song'),
    async execute(interaction) {
        skip(interaction);
    },
};