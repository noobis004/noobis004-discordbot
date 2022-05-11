const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client.js');
const config = require('./config.json');
const { Player } = require('discord-player')


const client = new Client()

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
            if (interaction.options.getSubcommand() === "play") {
                command.play(interaction)
            } else if (interaction.options.getSubcommand() === "stop") {
                command.stop(interaction, player)
            }
        }else {
            command.execute(interaction, client);
        }
    }   catch (error) {
        console.error(error);
        interaction.followUp({
            content: 'There was an error trying to execute that command!',
        });
    }
    
});

client.login(config.token);