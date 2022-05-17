const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require("fs");


const readFileLines = filename =>
   fs.readFileSync(filename)
   .toString('UTF8')
   .split('\n');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fractal')
		.setDescription('Gives you a random fractal'),

    async execute(interaction) {
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
        }

        var array = readFileLines('txt-arrays/fractals.txt')
        var arrayLength = array.length;

        const imagenumber = getRandomInt(0, arrayLength - 1);

        
        
        const Embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Fractal')
        .setImage(array[imagenumber])
        .setTimestamp()
        .setFooter({ text: 'Sourced from giphy', iconURL: 'https://i.imgur.com/xIAmGcj.png' });

        console.log(imagenumber + 1, array[imagenumber]);
        interaction.reply({ embeds:  [Embed] });
    },
    
}

