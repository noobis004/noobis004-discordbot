const { SlashCommandBuilder } = require('@discordjs/builders');
const { GuildMember } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const ytdb = require('ytdl-core');
const play = require('play-dl');
global.AbortController = require('node-abort-controller').AbortController;

const queue = new Map();
var audioplayer;
var firstsong = true;


module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Joins the voice channel you are currently in!')
        .addStringOption(option => 
            option.setName('song')
            .setDescription('The song you wanna play')
            .setRequired(true)),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

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
        
        const server_queue = queue.get(interaction.guild.id);
        let song = {};

        if (ytdb.validateURL(interaction.options.getString('song'))){
            const song_info = await ytdb.getInfo(interaction.options.getString('song'));
            song = {
                title: song_info.videoDetails.title,
                url: song_info.videoDetails.video_url,
            };

            if (!server_queue) {

                const queue_constructor = {
                    voice_channel: voiceChannel,
                    text_channel: interaction.channel,
                    connection: null,
                    songs: [],
                };

                queue.set(interaction.guild.id, queue_constructor);
                queue_constructor.songs.push(song);
                audioplayer = createAudioPlayer();

                try {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                    });
                    connection.subscribe(audioplayer);

                    queue_constructor.connection = connection;
                    song_Player(interaction.guild, queue_constructor.songs[0], audioplayer, interaction);
                }
                catch (err) {
                    queue.delete(interaction.guild.id);
                    interaction.reply({
                        content: 'There was an error connecting!',
                        ephemeral: true,
                    });
                    throw err;
                }

            } else {
                server_queue.songs.push(song);
                return interaction.reply({
                    content: `👍 **${song.title}** added to the queue!`,
                });
            }

        } else {
            return void interaction.reply({
                content: 'invalid url',
                ephemeral: true,
            });
        }  
    },
};




const song_Player = async (guild, song, audioplayer, interaction) => {
    const song_queue = queue.get(guild.id);

    if (!song) {
        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        connection.destroy();
        queue.delete(guild.id);
        firstsong = true;
        return;
    }
    console.log(song.url);
    let stream = await play.stream(song.url); 
    let resource = createAudioResource(stream.stream, {
        inputType: stream.type
    })
    audioplayer.play(resource);
    audioplayer.on('error', error => {
        console.error(`Error: ${error.message}`);
        next_song(guild, audioplayer, interaction);
    });
    audioplayer.on(AudioPlayerStatus.Idle, () => {
        next_song(guild, audioplayer, interaction);
    });
    if (firstsong) {
        firstsong = false;
        await interaction.reply(`🎶 Now playing **${song.title}**`)
    } else {
        await song_queue.text_channel.send(`🎶 Now playing **${song.title}**`);
    }
}

const next_song = async (guild, audioplayer, interaction) => {
    const song_queue = queue.get(guild.id);

    song_queue.songs.shift();
    song_Player(guild, song_queue.songs[0], audioplayer, interaction);
}

const skip = async (interaction) =>  {
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

    const server_queue = queue.get(interaction.guild.id)
    
    if (!server_queue) {
        return void interaction.reply({
            content: "There are currently no songs playing!",
            ephemeral: true,
        });
    } else {
        const song = server_queue.songs[0];
        next_song(interaction.guild, audioplayer, interaction);
        interaction.reply({
            content: `:fast_forward:Skipped ${song.title}`
        })
    }
}

const stop = async (interaction) => {
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

    const voiceChannel = interaction.member.voice.channel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    
    connection.destroy();
    queue.delete(interaction.guild.id);
    interaction.reply('Music stopped!');
    return;
}

module.exports = { skip, stop }
