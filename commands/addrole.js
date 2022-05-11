const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Adds role to member!')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to add the role to')
                .setRequired(true))
        .addRoleOption( option =>
            option.setName('role')
                .setDescription('The role to give to the member')
                .setRequired(true)),
    async execute(interaction) {
        if (interaction.user.id === '286143081735258113') {
            const member = interaction.options.getMember('member');
            const role = interaction.options.getRole('role');
            member.roles.add(role);
            interaction.reply(`${role} has been given to ${member}`);
        } else {
            await interaction.reply({ content: 'You do not have the permission to do that', ephemeral: true});
        }

    },
};