const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Removes role from a member!')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to remove the role from')
                .setRequired(true))
        .addRoleOption( option =>
            option.setName('role')
                .setDescription('The role to remove from the member')
                .setRequired(true)),
    async execute(interaction, client) {
        if (interaction.user.id === '286143081735258113') {
            const member = interaction.options.getMember('member');
            const role = interaction.options.getRole('role');
            member.roles.remove(role);
            interaction.reply(`${role} has been removed from ${member}`);
        } else {
            await interaction.reply({ content: 'You do not have the permission to do that', ephemeral: true});
        }
        
    },
};