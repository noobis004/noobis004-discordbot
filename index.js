const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client.js');
const config = require('./config.json');
const { Player } = require('discord-player')


const client = new Client();
const music_channels = new Map();


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
        if (interaction.commandName == 'music') {
            if (music_channels.get(interaction.guild.id) === interaction.channel.id) {
                if (interaction.options.getSubcommand() === "play") {
                    command.play(interaction);
                } else if (interaction.options.getSubcommand() === "stop") {
                    command.stop(interaction);
                }
            } else if (music_channels.has(interaction.guild.id)) {
                interaction.reply({
                    content: 'Music commands needs to be sent in <#' + music_channels.get(interaction.guild.id) +'>',
                    ephemeral: true,
                });
            } else if (interaction.member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
                interaction.reply({
                    content: 'To do music commands you need to specify a channel to run them. \nDo **/setmusicchannel** in the desired channel.',
                    ephemeral: true
                })
            } else {
                interaction.reply({
                    content:'To do music commands you need a specific channel to run them in. \nAsk the server owner to set it up.',
                    ephemeral: true,
                })
            }
        } else if (interaction.commandName == 'setmusicchannel') {
            if (interaction.member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
                music_channels.set(interaction.guild.id, interaction.channel.id);

                fs.writeFile('/config.json', data, { flag: 'a+' }, err => {
                    if (err) {
                        console.error(err);
                    }
                });
                interaction.reply({
                    content: 'Channel set to music channel',
                });
            } else {
                interaction.reply({
                    content: 'you do not have the permission to do that',
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