const { SlashCommandBuilder } = require('@discordjs/builders');
const { removesong } = require('./music')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removesong')
		.setDescription('Removes a certain song.')
        .addIntegerOption( option =>
            option.setName('songid')
            .setDescription('The ID of the song you wanna remove (find by doing /queue).')
            .setRequired(true)),
    async execute(interaction) {
        removesong(interaction)
    },
};