const { SlashCommandBuilder } = require('@discordjs/builders');
const { GuildMember, interaction } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, generateDependencyReport, AudioPlayerStatus } = require('@discordjs/voice');
const { QueryType} = require('discord-player');
const config = require('../config.json');
const ytdb = require('ytdl-core');

var isplaying;


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
        
        const songinfo = await ytdb.getInfo(url);
        const song = {
            title: songinfo.videoDetails.title,
            length: songinfo.videoDetails.lengthSeconds,
        };

        if (isplaying) {
            return void interaction.reply({
                content: 'song already playing',
                ephemeral: true,
            })
        }
       
        const stream = ytdb(url, {filter: 'audioonly'});
        const audioplayer = createAudioPlayer();
        const resource = createAudioResource(stream);


        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: config.guildId,
            adapterCreator: interaction.channel.guild.voiceAdapterCreator,
        });
        
        connection.subscribe(audioplayer);
        audioplayer.play(resource);
        isplaying = true;
        interaction.reply(`Started playing ${song.title}`);

        const subscription = connection.subscribe(audioplayer);

        audioplayer.on(AudioPlayerStatus.Idle, () => {
            isplaying = false;
        })
    },
    async stop(interaction, player) {
        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: config.guildId,
            adapterCreator: interaction.channel.guild.voiceAdapterCreator,
        });
        
        connection.destroy();
        interaction.reply('Music stopped!');
        isplaying = false;
    }
};
