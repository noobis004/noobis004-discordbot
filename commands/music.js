const { SlashCommandBuilder } = require('@discordjs/builders');
const { GuildMember } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdb = require('ytdl-core');
const play = require('play-dl');
global.AbortController = require('node-abort-controller').AbortController;

const queue = new Map();
const notInVcMap = new Map();
const isDoneMap = new Map();
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));


const inVC = async (interaction) => {
    const server_queue = queue.get(interaction.guild.id)
    let notinvc = false;
    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
        notinvc = true;
        notInVcMap.set(interaction.guild.id, notinvc);
        await interaction.editReply({
        content: 'You are not in a voice channel!',
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
        return;
    } else if (!server_queue) {
        notInVcMap.set(interaction.guild.id, notinvc);
        return;
    } else if (interaction.member.voice.channel.id != server_queue.voice_channel.id) {
        notinvc = true;
        notInVcMap.set(interaction.guild.id, notinvc);
        await interaction.editReply({
            content: 'Bot is currently playing in a different voicechannel.',
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
    } else {
        notInVcMap.set(interaction.guild.id, notinvc);
        return;
    }
}

const showqueue = async (interaction) => {
    const song_queue = queue.get(interaction.guild.id)
    var finalsongnames = '**Current queue**:\n';
    var finalqueueeditReply = '**Currently playing**:\n'
    
    if (!song_queue) {
        await interaction.editReply({
            content: 'There are currently no songs playing.',
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
        return;
    } else {
        const songnames = song_queue.songs;
        finalqueueeditReply = finalqueueeditReply + songnames[0].title + '\n'

        if (!songnames[1]) {
            finalsongnames = finalsongnames + 'no songs queued up atm.\n';
        }else {
            for (let i = 1; i < songnames.length; i++) {
                finalsongnames = finalsongnames + `(${i}) ${songnames[i].title}\n`;
            }
        }
        
        finalsongnames = finalsongnames + '__                                 __';
        if (song_queue.looping) {
            finalsongnames = finalsongnames + '\n       **loop is on.**'
        }
       
        await interaction.editReply({
            content: finalqueueeditReply + finalsongnames,
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        return;
    }
}

const loop = async (interaction) => {
    await inVC(interaction);
    const notinvc = notInVcMap.get(interaction.guild.id)
    if (notinvc) {
        notInVcMap.delete(interaction.guild.id);
        return;
    } else {
        notInVcMap.delete(interaction.guild.id);
    }

    const server_queue = queue.get(interaction.guild.id)

    if (!server_queue) {
        await interaction.editReply({
            content: 'There are currently no songs playing!',
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
        return;
    }

    if (!server_queue.looping) {
        console.log(`loop on :${interaction.guild.name} `)
        server_queue.looping = true;
        await interaction.editReply({ 
            content: 'Looping is now on.',
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        return;
    } else {
        console.log(`loop off :${interaction.guild.name}`)
        server_queue.looping = false;
        await interaction.editReply({
            content: 'Looping is now off.',
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        return;
    }
}

const skip = async (interaction) =>  {
    await inVC(interaction);
    const notinvc = notInVcMap.get(interaction.guild.id)
    if (notinvc) {
        notInVcMap.delete(interaction.guild.id);
        return;
    } else {
        notInVcMap.delete(interaction.guild.id);
    }

    const server_queue = queue.get(interaction.guild.id)

    if (!server_queue) {
        await interaction.editReply({
            content: "There are currently no songs playing!",
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
        return;
    } else {
        const song = server_queue.songs[0];
        console.log(`skipped ${song.url} :${interaction.guild.name}`)
        await interaction.editReply({
            content: `:fast_forward:Skipped ${song.title}.`
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        next_song(interaction.guild, server_queue.audioplayer, interaction, server_queue.connection);
    }
}

const stop = async (interaction) => {
    await inVC(interaction);
    const notinvc = notInVcMap.get(interaction.guild.id)
    if (notinvc) {
        notInVcMap.delete(interaction.guild.id);
        return;
    }

    const server_queue = queue.get(interaction.guild.id);
    if (!server_queue) {
        await interaction.editReply({
            content: "There are currently no songs playing.",
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
        return;
    }
    
    console.log(`Music stopped, Disconnecting :${interaction.guild.name}`)
    server_queue.connection.destroy();
    queue.delete(interaction.guild.id);
    await interaction.editReply({
        content: 'Music stopped!',
    }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
    return;
}

const removesong = async (interaction) => {
    await inVC(interaction);
    const notinvc = notInVcMap.get(interaction.guild.id);
    if (notinvc) {
        notInVcMap.delete(interaction.guild.id);    
        return;
    }

    const server_queue = queue.get(interaction.guild.id);
    if (!server_queue) {
        await interaction.editReply({
            content: "There are currently no songs playing.",
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
        return;
    }

    const SongID = interaction.options.getInteger('songid');
    const songname = server_queue.songs

    if (!server_queue.songs[SongID] || SongID === 0) {
        await interaction.editReply({
            content: `Specified songID doesn't exist.`,
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
        return;
    } else {
        await interaction.editReply({
            content: `removed ${songname[SongID].title}.`,
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        server_queue.songs.splice(SongID, 1);
        return;
    }
}

const movetofirst = async (interaction) => {
     await inVC(interaction);
    const notinvc = notInVcMap.get(interaction.guild.id);
    if (notinvc) {
        notInVcMap.delete(interaction.guild.id);    
        return;
    }

    const server_queue = queue.get(interaction.guild.id);
    if (!server_queue) {
        await interaction.editReply({
            content: "There are currently no songs playing.",
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
        return;
    }
    
    const SongID = interaction.options.getInteger('songid');
    const songname = server_queue.songs

    if (!server_queue.songs[SongID] || SongID === 0) {
        await interaction.editReply({
            content: `Specified songID doesn't exist.`,
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
        return;
    } else if (SongID === 1) {
        await interaction.editReply({
            content: 'Song is already first in queue.'
        })
    } else {
        await interaction.editReply({
            content: songname[SongID].title + ' will play next.',
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
        const selectedSong = server_queue.songs.splice(SongID, 1)[0];
        server_queue.songs.splice(1, 0, selectedSong);
        return;
    }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Joins the voice channel you are currently in!')
        .addStringOption(option => 
            option.setName('url')
            .setDescription('The URL to the song you wanna play')
            .setRequired(true)),
    async execute(interaction) {
        await inVC(interaction);
        const notinvc = notInVcMap.get(interaction.guild.id)
        if (notinvc) {
            notInVcMap.delete(interaction.guild.id);
            return;
        } else {
            notInVcMap.delete(interaction.guild.id);
        }


        const voiceChannel = interaction.member.voice.channel;
        let server_queue = queue.get(interaction.guild.id);
        let song = {};

        if (ytdb.validateURL(interaction.options.getString('url'))){
            const song_info = await ytdb.getInfo(interaction.options.getString('url'));
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
                    audioplayer: null,
                    looping: false,
                    firstsong: true,
                    turnonlookforidle: true,
                    songs: [],
                };

                queue_constructor.songs.push(song);
                queue_constructor.audioplayer = createAudioPlayer();
                queue.set(interaction.guild.id, queue_constructor);

                try {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                    });
                    connection.subscribe(queue_constructor.audioplayer);

                    queue_constructor.connection = connection;
                    song_Player(interaction.guild, queue_constructor.songs[0], queue_constructor.audioplayer, interaction, connection);
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
                console.log(`queued ${song.url} :${interaction.guild.name}`)
                await interaction.editReply({
                    content: `👍 **${song.title}** added to the queue!`,
                }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
                return
            }

        } else {
            await interaction.editReply({
                content: 'invalid url!',
            }).then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
            return;
        }  
    },skip, stop, loop, showqueue, removesong, movetofirst
};


const song_Player = async (guild, song, audioplayer, interaction, connection) => {
    const song_queue = queue.get(guild.id);
    const isdone = isDoneMap.get(guild.id);

    if (!song) {
        await queue_empty(guild, audioplayer, song_queue.text_channel, interaction, connection);
        if (isdone) {
            isDoneMap.delete(guild.id)
            return;
        }
    }
    let stream = await play.stream(song.url); 
    let resource = createAudioResource(stream.stream, {
        inputType: stream.type
    })
    console.log(`playing ${song.url} :${guild.name}`);
    audioplayer.play(resource);     
    audioplayer.on('error', error => {
        console.error(`Error: ${error.message}`);
        next_song(guild, audioplayer, interaction, connection);
    });
    if (song_queue.turnonlookforidle) {
        audioplayer.on(AudioPlayerStatus.Idle, () => {
            console.log(`Song done playing next song :${guild.name}.`)
            next_song(guild, audioplayer, interaction, connection);
            return;
        });
        song_queue.turnonlookforidle = false;
    }
   
    if (song_queue.firstsong) {
        song_queue.firstsong = false;
        await interaction.editReply({
            content: `🎶 Now playing **${song.title}**\n${song.url}.`,
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
    } else {
        await song_queue.text_channel.send({
            content: `🎶 Now playing **${song.title}**.`,
        }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
    }
}

const next_song = async (guild, audioplayer, interaction , connection) => {
    const song_queue = queue.get(guild.id);

    if (song_queue.looping) {
        const loopsong = song_queue.songs.shift();
        song_queue.songs.push(loopsong);
        song_Player(guild, song_queue.songs[0], audioplayer, interaction, connection);
    } else {
        song_queue.songs.shift();
        song_Player(guild, song_queue.songs[0], audioplayer, interaction, connection);
    }
}

const queue_empty = async (guild, audioplayer, text_channel, interaction, connection) => {
    await text_channel.send({
        content: 'Queue is empty!',
    }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
    let start = true;
    let isdone = false;
    let queueEmptylooptimes = 150;
    let queueEmptytimeslooped = 0;
    audioplayer.pause();
    while(start) {
        const song = queue.get(guild.id).songs[0];
        if (!song) {
            if (queueEmptytimeslooped <= queueEmptylooptimes) {
                queueEmptytimeslooped += 1;
            } else {
                console.log(`Inactive disconnecting :${guild.name}`)
                connection.destroy();
                queue.delete(guild.id);
                await text_channel.send({
                    content: 'Bot inactive disconecting!',
                }).then(m => setTimeout(() => m.delete().catch(() => { }), 15000));
                isdone = true;
                isDoneMap.set(guild.id, isdone);
                start = false;
                return
            }
        } else {
            await song_Player(guild, song, audioplayer, interaction, connection)
            start = false;
            isdone = true;
            isDoneMap.set(guild.id, isdone);
            return;
        }
        await sleep(1000);
    }
}   