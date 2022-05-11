const { SlashCommandBuilder } = require('@discordjs/builders');
const { GuildMember, interaction } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, generateDependencyReport } = require('@discordjs/voice');
const { QueryType} = require('discord-player');
const config = require('C:/discord test bot/config.json');
const ytdb = require('ytdl-core');
const ytdl = require('ytdl-core');




module.exports = {
	data: new SlashCommandBuilder()
		.setName('music')
		.setDescription('Joins the voice channel you are currently in!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Plays music from a youtube link')
                .addStringOption(option => option.setName('song').setDescription('The song you wanna play').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stops the music!')),
    async play(interaction  ) {
        const url = interaction.options.getString('song');
        if (!url.startsWith('https://www.youtube.com/watch?v=')) {
            return void interaction.reply({
                content: 'Song needs to be a YouTube link!',
                ephemeral: true,
                });
        }

        const songinfo = await ytdl.getInfo(url )
        const song = {
            title: songinfo.videoDetails.title,
        };
       
        const stream = ytdb(url, {filter: 'audioonly'});
        const audioplayer = createAudioPlayer();
        const resource = createAudioResource(stream);

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: config.guildId,
            adapterCreator: interaction.channel.guild.voiceAdapterCreator,
        });
        if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
            return void interaction.reply({
            content: 'You are not in a voice channel!',
            ephemeral: true,
            });
        }
        
        if (
            interaction.guild.me.voice.channelId &&
            interaction.member.voice.channelId !== interaction.guild.me.voice.channelId
        ) {
            return void interaction.reply({
            content: 'You are not in my voice channel!',
            ephemeral: true,
            });
        }
        connection.subscribe(audioplayer);
        audioplayer.play(resource);
        interaction.reply(`Started playing ${song.title}`);

        const subscription = connection.subscribe(audioplayer);

    },
    async stop(interaction, player) {
        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: config.guildId,
            adapterCreator: interaction.channel.guild.voiceAdapterCreator,
        });
        
        connection.destroy();
        interaction.reply('Music stopped!');
    }
};
