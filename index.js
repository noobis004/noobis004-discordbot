const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client.js');
const config = require('./config.json');
const { Player } = require('discord-player');
const { MessageEmbed } = require('discord.js')
global.AbortController = require('node-abort-controller').AbortController;


const client = new Client();

const readFileLines = filename =>
fs.readFileSync(filename)
.toString('UTF8');

var ids;
var music_channels = new Map();
var music_embed = new Map();
const musicChannelId = readFileLines('./musicChannelId.json')
if (musicChannelId) {
    ids = JSON.parse(musicChannelId.toString());
    music_channels = new Map(Object.entries(ids));
}
const commandsembed = new MessageEmbed()
.setColor('#0099ff')
.setTitle('**Music Commands**')
.setDescription('All muscic commands.')
.setAuthor({ name: 'Dumb fuck', iconURL: 'https://i.imgur.com/E2nCUbn.png'})
.addFields(
    { name: "/play ('URL')", value: "d", inline: true },        
    { name: "/stop", value: "d" },
    { name: "/skip", value: "d", inline: true },
    { name: "/loop", value: "d" },
    { name: "/queue", value: "d" }  
)


client.commands = new Discord.Collection();
const commandfiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandfiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

const player = new Player(client);

client.once('ready', () => {
	console.log('Ready!');
    client.user.setActivity('noobis torture himself', { type: 'WATCHING' });
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

    if (!command) return;
    
    try {
        if (interaction.commandName == 'play' || interaction.commandName == 'stop' || interaction.commandName == 'skip' || interaction.commandName == "loop" || interaction.commandName == "queue" || interaction.commandName == "removesong" || interaction.commandName == "playnext") {
            if (music_channels.get(interaction.guild.id) === interaction.channel.id) {
                await interaction.deferReply();
                command.execute(interaction);
            } else if (music_channels.has(interaction.guild.id)) {
                interaction.reply({
                    content: `Music commands needs to be sent in <#${music_channels.get(interaction.guild.id)}>`,
                    ephemeral: true,
                });
            } else if (interaction.member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
                interaction.reply({
                    content: 'To do music commands you need to specify a channel to run them. \nDo **/setmusicchannel** in the desired channel.',
                    ephemeral: true
                })
            } else {
                interaction.reply({
                    content:'The music commands need a specific channel to run them in. \nAsk the server owner to set it up.',
                    ephemeral: true,
                })
            }
        } else if (interaction.commandName == 'setmusicchannel') {
            if (interaction.member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR) || interaction.user.id == '286143081735258113') {
                music_channels.set(interaction.guild.id, interaction.channel.id);
                const obj = Object.fromEntries(music_channels);
                const data = JSON.stringify(obj);
                fs.writeFile('./musicChannelId.json', data,  err => {
                    if (err) {
                        console.error(err);
                    }
                });
                await interaction.reply({
                    content: 'Channel set to music channel',
                    ephemeral: true,
                });
                interaction.channel.send({ embeds: [commandsembed] });
            } else {
                interaction.reply({
                    content: 'you do not have the permission to do that',
                    ephemeral: true,
                });
            }
        } else {
            command.execute(interaction, client);
        }
    }   catch (error) {
        console.error(error);
        interaction.followUp({
            content: 'There was an error trying to execute that command!',
            ephemeral: true,
        });
    }
    
});


client.login(config.token);