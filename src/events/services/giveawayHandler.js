const client = require(`../../index`);
const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const gawModel = require(`../../Models/giveawaySchema`);
const config = require(`../../config/giveaway.json`);

module.exports = {
    name: 'giveawayHandler'
}

client.on('interactionCreate', async interaction => {
    if(!interaction.isButton()) return;
    if(!interaction.customId.startsWith('gaw')) return;

    if(interaction.customId == 'gaw-enter'){
        let gentry = await gawModel.findOne({msgid: interaction.message.id, serverID: interaction.guildId});
        if(!gentry.status) {
            await interaction.reply({content:'This giveaway has been ended', ephemeral: true});
            return;
        }

        if(gentry.entries.includes(interaction.member.id)) {
            let mg = await interaction.reply({content: 'Do you want to leave the Giveaway', components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('gawentry-yes').setLabel('Yes').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('gawentry-no').setLabel('No').setStyle(ButtonStyle.Secondary)
            )], fetchReply: true, ephemeral: true});
            await mg.awaitMessageComponent({filter: (i) => i.isButton() && i.user.id == interaction.user.id, idle: 30000})
            .then(async i => {
                if(i.customId == 'gawentry-yes') {
                    var newList = [];
                    gentry.entries.forEach(i => {
                        if(i != interaction.member.id) newList.push(i)
                    });
                    gentry.entries = newList;
                    gentry.save();

                    i.reply({content: 'Successfuly opted out of the Giveaway', ephemeral: true});
                } else i.deferUpdate()
                await interaction.deleteReply().catch(e => null);
            })
            .catch(e => {
                interaction.deleteReply().catch(e => null);
            });

            let newLabel = [... new Set(gentry.entries)].length;
            await interaction.message.edit({components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('gaw-enter').setStyle(ButtonStyle.Success).setLabel(`${newLabel}`).setEmoji(config.emote?.startsWith('<:')?config.emote:'🎉'))]})

            return;
        }

        await interaction.deferReply({ephemeral: true, fetchReply: true});

        if(gentry.entries.length >= Number(gentry.entrylimit)){
            await interaction.editReply('All entries in the Giveaway has been collected. No more entried will be taken.');
            return;
        }

        let req = gentry.req;
        var reqfulfill = false;
        if(req.has('role')){
            let val = req.get('role');
            val?.forEach(async roleId => {
                if(interaction.member.roles.cache.has(roleId)) reqfulfill = true;
            });
        } else reqfulfill = true;
        if(!reqfulfill) {
            await interaction.editReply('You are not having any Required Role to take part in the Giveaway');
            return;
        }

        reqfulfill = true;
        if(req.has('blackrole')){
            let val = req.get('blackrole');
            val?.forEach(async roleId => {
                if(interaction.member.roles.cache.has(roleId)) reqfulfill = false;
            })
        };
        if(!reqfulfill) {
            await interaction.editReply('You are having a blacklsted role');
            return;
        }

        if(req.has('join')){
            let val = req.get('join');
            if(Date.now() - interaction.member.joinedTimestamp <= val) reqfulfill = false;
        }
        if(!reqfulfill) {
            await interaction.editReply('You are not enough old Member of this Server');
            return;
        }

        if(req.has('age')){
            let val = req.get('age');
            if(Date.now() - interaction.member.joinedTimestamp <= val) reqfulfill = false;
        }
        if(!reqfulfill) {
            await interaction.editReply('You are not enough old to take part in the Giveaway');
            return;
        }

        let multi = gentry.multi;
        interaction.member.roles.cache.forEach(async role => {
            if(multi.has(role.id)){
                let times = multi.get(role.id);
                while(times > 1){
                    gentry.entries.push(interaction.member.id); // Multiplier Entries
                    times = times - 1;
                }
            }
        });

        gentry.entries.push(interaction.member.id); // Normal Entry
        gentry.save();

        interaction.editReply('Successfully taken part in the Giveaway.');

        let newLabel = [... new Set(gentry.entries)].length;
        interaction.message.edit({components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('gaw-enter').setStyle(ButtonStyle.Success).setLabel(`${newLabel}`).setEmoji(config.emote?.startsWith('<:')?config.emote:'🎉'))]});

    }
})
