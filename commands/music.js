const { SlashCommandBuilder } = require('@discordjs/builders');
const { GuildMember } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdb = require('ytdl-core');
const play = require('play-dl');
global.AbortController = require('node-abort-controller').AbortController;

const queue = new Map();
var audioplayer;
var firstsong = true;
var looping = false;
let isdone = false;
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));


const inVC = async (interaction) => {
    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
        return void interaction.editReply({
        content: 'You are not in a voice channel!',
        ephemeral: true,
        });
    }
    
    if (
        interaction.guild.me.voice.channelId &&
        interaction.menmber.voice.channelId !== interaction.guild.me.voice.channelId
    ) {
        return void interaction.editReply({
        content: 'You are not in my voice channel!',
        ephemeral: true,
        });
    }
}

const showqueue = async (interaction) => {
    const song_queue = queue.get(interaction.guild.id)
    var finalsongnames = '**Current queue**:\n';
    var finalqueueeditReply = '**Currently playing**:\n'
    
    if (!song_queue) {
        return void interaction.editReply({
            content: 'There are currently no songs playing',
            ephemeral: true,
        });
    } else {
        const songnames = song_queue.songs;
        finalqueueeditReply = finalqueueeditReply + songnames[0].title + '\n'

        for (let i = 1; i < songnames.length; i++) {
            finalsongnames = finalsongnames + songnames[i].title + '\n';
        }
        if(looping) {
            finalsongnames = finalsongnames + 'loop is on'
        }
       
        await interaction.editReply({
            content: finalqueueeditReply + finalsongnames,
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        return;
    }
}

const loop = async (interaction) => {
    inVC(interaction);
    const server_queue = queue.get(interaction.guild.id)

    if (!server_queue) {
        return void interaction.editReply({
            content: 'There are currently no songs playing!',
            ephemeral: true,
        });
    }

    if (!looping) {
        console.log('loop on')
        looping = true;
        await interaction.editReply({ 
            content: 'Looping is now on',
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        return;
    } else {
        console.log('loop off')
        looping = false
        await interaction.editReply({
            content: 'Looping is now off',
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        return;
    }
}

const skip = async (interaction) =>  {
    inVC(interaction);

    const server_queue = queue.get(interaction.guild.id)

    if (!server_queue) {
        return void interaction.editReply({
            content: "There are currently no songs playing!",
            ephemeral: true,
        });
    } else {
        const song = server_queue.songs[0];
        console.log(`skipped ${song.url}`)
        await interaction.editReply({
            content: `:fast_forward:Skipped ${song.title}`
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        next_song(interaction.guild, audioplayer, interaction);
    }
}

const stop = async (interaction) => {
    inVC(interaction);
    const server_queue = queue.get(interaction.guild.id);
    
    if(!server_queue) {
        return void interaction.editReply({
            content: "There are currently no songs playing",
            ephemeral: true,
        });
    }
    const voiceChannel = interaction.member.voice.channel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    
    console.log('Music stopped, Disconnecting')
    looping = false;
    firstsong = true;
    connection.destroy();
    queue.delete(interaction.guild.id);
    await interaction.editReply({
        content: 'Music stopped!',
    }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
    return;
}


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
        inVC(interaction);
        
        const server_queue = queue.get(interaction.guild.id);
        let song = {};

        if (ytdb.validateURL(interaction.options.getString('song'))){
            const song_info = await ytdb.getInfo(interaction.options.getString('song'));
            song = {
                title: song_info.videoDetails.title,
                url: song_info.videoDetails.video_url,
                thumbnail: song_info.thumbnail_url,
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
                    interaction.editReply({
                        content: 'There was an error connecting!',
                        ephemeral: true,
                    });
                    throw err;
                }

            } else {
                server_queue.songs.push(song);
                console.log(`queued ${song.url}`)
                await interaction.editReply({
                    content: `👍 **${song.title}** added to the queue!`,
                }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
                setTimeout(interaction.deleteReply, 20_000);
                return
            }

        } else {
            return void interaction.editReply({
                content: 'invalid url',
                ephemeral: true,
            });
        }  
    },skip, stop, loop, showqueue
};


const song_Player = async (guild, song, audioplayer, interaction) => {
    const song_queue = queue.get(guild.id);

    if (!song) {
        await queue_empty(guild, audioplayer, song_queue.text_channel, interaction);
        if (isdone) {
            isdone = false;
            return;
        }
    }
    let stream = await play.stream(song.url); 
    let resource = createAudioResource(stream.stream, {
        inputType: stream.type
    })
    console.log(`playing ${song.url}`);
    audioplayer.play(resource);     
    audioplayer.on('error', error => {
        console.error(`Error: ${error.message}`);
        next_song(guild, audioplayer, interaction);
    });
    audioplayer.on(AudioPlayerStatus.Idle, () => {
        console.log('Song done playing next song')
        next_song(guild, audioplayer, interaction);
    });
    if (firstsong) {
        firstsong = false;
        await interaction.editReply({
            content: `🎶 Now playing **${song.title}**\n${song.url}`,
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
    } else {
        await song_queue.text_channel.send({
            content: `🎶 Now playing **${song.title}**`,
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
    }
}

const next_song = async (guild, audioplayer, interaction) => {
    const song_queue = queue.get(guild.id);

    if (looping) {
        const loopsong = song_queue.songs.shift();
        song_queue.songs.push(loopsong);
        song_Player(guild, song_queue.songs[0], audioplayer, interaction);
    } else {
        song_queue.songs.shift();
        song_Player(guild, song_queue.songs[0], audioplayer, interaction);
    }
}

const queue_empty = async (guild, audioplayer, text_channel, interaction) => {
    await text_channel.send({
        content: 'Queue is empty!',
    }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
    let start = true;
    let queueEmptylooptimes = 150;
    let queueEmptytimeslooped = 0;
    audioplayer.pause();
    while(start) {
        const song = queue.get(guild.id).songs[0];
        if (!song) {
            if (queueEmptytimeslooped <= queueEmptylooptimes) {
                queueEmptytimeslooped += 1;
            } else {
                const connection = joinVoiceChannel({
                    channelId: interaction.member.voice.channel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
                console.log('Inactive disconnecting')
                connection.destroy();
                queue.delete(guild.id);
                firstsong = true;
                await text_channel.send({
                    content: 'Bot inactive disconecting!',
                }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
                isdone = true;
                return
            }
        } else {
            await song_Player(guild, song, audioplayer, interaction)
            start = false;
        }
        await sleep(1000);
    }
}   