const { SlashCommandBuilder } = require('@discordjs/builders');
const { movetofirst } = require('./music')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playnext')
		.setDescription('Moves the specified song to first in the queue.')
        .addIntegerOption( option =>
            option.setName('songid')
            .setDescription('The ID of the song you wanna play next (find by doing /queue).')
            .setRequired(true)),
    async execute(interaction) {
        movetofirst(interaction)
    },
};

