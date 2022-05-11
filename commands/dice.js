const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('roll the dice!'),
    async execute(interaction) {
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
          }
        interaction.reply(`You rolled a: ${getRandomInt(1, 6)}`);
    },
};