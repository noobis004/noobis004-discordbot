const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('yes')
		.setDescription('Replies with yes!'),
    async execute(interaction, client) {
        const user = interaction.author.id;
        await interaction.reply(user);
    },
};