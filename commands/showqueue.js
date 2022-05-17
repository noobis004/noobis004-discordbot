const { SlashCommandBuilder } = require('@discordjs/builders');
const { showqueue } = require('./music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('showqueue')
		.setDescription('Shows the current queue'),
    async execute(interaction) {
        showqueue(interaction);
    },
};