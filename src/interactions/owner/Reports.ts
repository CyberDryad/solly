import BotInteraction from '../../types/BotInteraction';
import { ChatInputCommandInteraction, SlashCommandBuilder, User, EmbedBuilder } from 'discord.js';

export default class Pass extends BotInteraction {
    get name() {
        return 'reports';
    }

    get description() {
        return 'Get all active reports for a specified user';
    }

    get permissions() {
        return 'ELEVATED_ROLE';
    }

    public getReportsForUser = async (user: User) => {
        try {
            const reports = await this.client.database.get('reports');
            return reports[`<@${user.id}>`];
        } catch {
            return 0;
        }
    }

    get slashData() {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addUserOption((option) => option.setName('user').setDescription('User').setRequired(true))
    }

    async run(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const userResponse: User = interaction.options.getUser('user', true);

        const { colours } = this.client.util;

        const reports = await this.getReportsForUser(userResponse);
        let totalReports = 0;
        if (reports) {
            Object.keys(reports).forEach(key => {
                totalReports += reports[key].length;
            })
            let embedDescription = '';
            Object.keys(reports).forEach(key => {
                if (reports[key].length) {
                    let chunkForKey = `\n${key}: ${reports[key].length}\n`;
                    reports[key].forEach((reportee: any) => {
                        chunkForKey += `⬥ By ${reportee.submitter} ${reportee.time ? `<t:${reportee.time}:R>. ${reportee.link ? `[Link](${reportee.link})` : ''}\n` : '\n'}`;
                    })
                    embedDescription += chunkForKey;
                }
            })
            embedDescription += `\n> There are **${totalReports}** total report${totalReports !== 1 ? 's' : ''}.`

            const replyEmbed = new EmbedBuilder()
                .setTitle(`Reports for ${userResponse.tag}`)
                .setColor(totalReports > 0 ? colours.discord.red : colours.discord.green)
                .setDescription(totalReports > 0 ? `${embedDescription}` : 'This user has no reports!');
            await interaction.editReply({ embeds: [replyEmbed] });
        } else {
            const replyEmbed = new EmbedBuilder()
                .setTitle(`Reports for ${userResponse.tag}`)
                .setColor(colours.discord.green)
                .setDescription('This user has no reports!');
            await interaction.editReply({ embeds: [replyEmbed] });
        }

    }
}