const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setmusicchannel')
		.setDescription('Sets the channel this is sent in to the music command channel.'),
}
