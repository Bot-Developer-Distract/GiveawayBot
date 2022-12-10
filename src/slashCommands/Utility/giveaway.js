const {Client, ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const ms = require('ms');
const emoji = require(`../../config/emoji.json`);
const gawModel = require('../../Models/giveawaySchema');
const config = require(`../../config/giveaway.json`);

module.exports = {
    name: 'giveaway',
    type: 1,
    options: [
        {
            name: 'start',
            description: 'Start a Giveaway in your Server',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'end',
            description: 'End a running giveaway',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'giveaway_id',
                    description: 'ID of the giveaway message',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: 'reroll',
            description: 'Reroll an ended giveaway',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'giveaway_id',
                    description: 'ID of the giveaway message',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: 'active_list',
            description: 'List of all active giveaways',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'drop',
            description: 'Drop a quick Giveaway',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'prize',
                    type: 3,
                    required: true,
                    min_length: 3,
                    description: 'Prize for the giveaway'
                },
                {
                    name: 'duration',
                    description: 'Duration for the Giveaway',
                    required: true,
                    type: 3
                },
                {
                    name: 'winner_count',
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                    min_value: 1,
                    max_value: 100,
                    description: 'Number of winners of the giveaway'
                },
                {
                    name: 'channel',
                    type: ApplicationCommandOptionType.Channel,
                    description: 'Channel to host the giveaway',
                    channel_types: [0]
                }
            ]
        }
    ],
    dm_permission: false,
    description: 'Run/Manage Giveaways in your Server',
    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction
     * @returns 
     */
    run :async(client, interaction) => {
        var exe = false;

        let l = config.managerroles;
        l.forEach(r => {
            if(interaction.member.roles.cache.has(r)) exe = true;
        });

        if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) && !exe)
        return interaction.reply({embeds:[new EmbedBuilder().setColor('Blue').setDescription('You are not alowed to use this command')], fetchReply: true});

        if(interaction.options.getSubcommand() == 'start'){
            await interaction.deferReply({fetchReply: true}).catch(e => null);
            const gembed = new EmbedBuilder().setThumbnail('https://media.discordapp.net/attachments/1020736180976890020/1041868280736010340/my-icon_1.png').setColor(interaction.guild.members.me.displayHexColor).setFooter({text:'Type Cancel to cancel the creation'});
            let cancel = false;
            var prize = null;
            var time = 60*1000;
            var host = interaction.member;
            var channel = interaction.channel;
            var limit = 'infinite';
            var winnerCount = 1;
            var req = new Map();
            var multi = new Map();

            await interaction.editReply({embeds: [gembed.setTitle('Giveaway Prize').setDescription(`What is the prize of this giveaway?\n> Example: \`XBOX Game Pass\`\n_ _`).setColor(config.color)]});

            await interaction.channel.awaitMessages({
                filter: (i)=> i.author.id == interaction.user.id,
                idle: 60000,
                max: 1
            }).then(async collected => {
                let got = collected.first();
                if(!got){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    return;
                }
                if(got.content.toLowerCase() == 'cancel'){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                }
                prize = got.content.slice(0, 256);
                got.delete().catch(e => null);
            });

            if(cancel) return;
            await interaction.editReply({embeds:[gembed.setTitle('Giveaway Time').setDescription(`The prize will be **${prize}**\n\nHow **long** should this giveaway last?\n> Example: 2w 5d 4h 57m 2s\n> w = week, d = day, h = hour, m = minutes, s = seconds`)]});

            await interaction.channel.awaitMessages({
                filter: (i)=> i.author.id == interaction.user.id,
                idle: 60000,
                max: 1
            }).then(async collected => {
                let got = collected.first();
                if(!got){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    return;
                }
                if(got.content.toLowerCase() == 'cancel'){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                }
                if(!ms(got.content)) {
                    interaction.editReply({embeds: [gembed.setDescription('Time Provided is invalid').setFooter({text: 'Creation has been cancelled'})]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                }
                if(ms(got.content) > 2419200000){
                    interaction.editReply({embeds: [gembed.setDescription('Time Provided is too big').setFooter({text: 'Creation has been cancelled'})]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                }
                if(ms(got.content) && ms(got.content) > 5000) time = ms(got.content);
                got.delete().catch(e => null);
            });

            if(cancel) return;
            await interaction.editReply({embeds: [gembed.setTitle('Giveaway Host').setDescription(`Got it! Giveaway will last for ${ms(time)}.\n\nWho is the host of this Giveaway?\n> Example: \`<@767383867031945236>\`, \`@Elitex\`, \`767383867031945236\`\n\nEnter \`skip\` to choose yourself`)]})

            await interaction.channel.awaitMessages({
                filter: (i)=> i.author.id == interaction.user.id,
                idle: 60000,
                max: 1
            }).then(async collected => {
                let got = collected.first();
                if(!got){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    return;
                }
                if(got.content.toLowerCase() == 'cancel'){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                }
                await interaction.guild.members.fetch(got.content).catch(e => null);
                
                if(!got.mentions.members.first() && !interaction.guild.members.cache.get(got.content) && got.content != 'skip') {
                    interaction.editReply({embeds: [gembed.setFooter({text: 'Creation has been cancelled'}).setDescription('Invalid Response')]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                }
                if(got.content == 'skip') host = interaction.member;
                else host = got.mentions.members.first() || interaction.guild.members.cache.get(got.content);
                got.delete().catch(e => null);
            });

            if(cancel) return;
            await interaction.editReply({embeds: [gembed.setTitle('Giveaway Channel').setDescription(`Host of the Giveaway is ${host}\n\nIn which Channel you want to Host the Giveaway?\n> Example: ${interaction.channel}`)]});

            await interaction.channel.awaitMessages({
                filter: (i)=> i.author.id == interaction.user.id,
                idle: 60000,
                max: 1
            }).then(async collected => {
                let got = collected.first();
                if(!got){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    return;
                }
                if(got.content.toLowerCase() == 'cancel'){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                }
                await interaction.guild.channels.fetch(got.content).catch(e => null);
                
                if(!got.mentions.channels.first() && !interaction.guild.channels.cache.get(got.content) && got.content != 'skip') {
                    interaction.editReply({embeds: [gembed.setDescription('Not a valid Channel.').setFooter({text: 'Creation has been cancelled'})]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                }
                if(![0, 5].includes(got.mentions.channels.first()?.type) && ![0, 5].includes(interaction.guild.channels.cache.get(got.content)?.type)){
                    interaction.editReply({embeds: [gembed.setDescription('Not a valid Channel.').setFooter({text: 'Creation has been cancelled'})]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return; 
                }
                if(got.content == 'skip') channel = interaction.channel;
                else channel = got.mentions.channels.first() || interaction.guild.channels.cache.get(got.content);
                got.delete().catch(e => null);
            });

            if(cancel) return;
            await interaction.editReply({embeds: [gembed.setTitle('Giveaway Entry Limit').setDescription(`Giveaway will be hosted in ${channel}\n\nHow many Entry Limit you want for the Giveaway?\n> Example: 1, 5, 10\n\nEnter \`skip\` to allow infinite entries.`)]});

            await interaction.channel.awaitMessages({
                filter: (i)=> i.author.id == interaction.user.id,
                idle: 60000,
                max: 1
            }).then(async collected => {
                let got = collected.first();
                if(!got){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    return;
                }
                if(got.content.toLowerCase() == 'cancel'){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                }
                if(got.content != 'skip' && Number.isInteger(Number(got.content)) && Number(got.content) > 0) limit = `${Number(got.content) || 'infinite'}`
                got.delete().catch(e => null);
            });

            if(cancel) return;
            await interaction.editReply({embeds: [gembed.setTitle('Giveaway Winner Count').setDescription(`New Entries will not be taken after ${limit} Entries\n\nHow many winners of the Giveaway?\n> Example: 1, 5, 10`)]});

            await interaction.channel.awaitMessages({
                filter: (i)=> i.author.id == interaction.user.id,
                idle: 60000,
                max: 1
            }).then(async collected => {
                let got = collected.first();
                if(!got){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    return;
                }
                if(got.content.toLowerCase() == 'cancel'){
                    interaction.editReply({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                    cancel = true;
                    got.delete().catch(e => null);
                    return;
                };
                if(got.content != 'skip' && Number.isInteger(Number(got.content)) && Number(got.content) > 0) winnerCount = `${Number(got.content) || 1}`
                got.delete().catch(e => null);
            });

            if(cancel) return;
            let msg = await interaction.editReply({
                embeds: [gembed.setTitle('Giveaway Preview').setFooter({text: 'Click Next when you are done'})
.setDescription(`
${emoji.point} **Basic Details**
${emoji.blankspace}${emoji.replyc} Prize: **${prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerCount}
${emoji.blankspace}${emoji.replyc} Ends: <t:${((Date.now() + time)/1000).toFixed(0)}>  [<t:${((Date.now() + time)/1000).toFixed(0)}:R>]
${emoji.blankspace}${emoji.replyc} Channel: ${channel}
${emoji.blankspace}${emoji.replyc} Host: ${host}
${emoji.blankspace}${emoji.reply} Ends at ${limit} Entries

${emoji.point} **Multiplier**
${emoji.blankspace}${emoji.reply} No Multiplier has been added
`)],
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('gaw-addmulti').setLabel('Add Multiplier').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('gaw-rmvmulti').setLabel('Remove Multiplier').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('gaw-nextmulti').setLabel('Next').setStyle(ButtonStyle.Success),
                )]
            });

            const collector = msg.createMessageComponentCollector({filter: (i) => i.isButton(), time: 120000});
            collector.on('end', async collected => {
                await interaction.editReply({components: []});
            });
            collector.on('collect', async i => {
                collector.resetTimer();
                if(i.user.id != interaction.user.id)
                return i.reply({content: ':x: These buttons are not for you', ephemeral: true});

                if(i.customId == 'gaw-addmulti'){
                    i.deferUpdate();
                    await interaction.editReply({components: []});
                    var role = null;
                    var entries = 2;
                    var can = false;

                    let ms = await interaction.followUp({embeds: [new EmbedBuilder().setColor('Blue').setDescription('Kindly Mention a Role or provide the Role ID, of the Role you wanna add to Multiplier')]})
                    await interaction.channel.awaitMessages({
                        filter: (m) => m.author.id == interaction.user.id,
                        idle: 60000,
                        max: 1
                    }).then(async collected => {
                        let got = collected.first();
                        if(!got){
                            ms.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('No response')]});
                            can = true;
                            return
                        };
                        role = got.mentions.roles.first() || interaction.guild.roles.cache.get(got.content);
                        if(!role){
                            got.delete().catch(e => null);
                            ms.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('No response')]});
                            can = true;
                            return;
                        }
                        got.delete().catch(e => null);
                    });
                    if(can) return await interaction.editReply({components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('gaw-addmulti').setLabel('Add Multiplier').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('gaw-rmvmulti').setLabel('Remove Multiplier').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-nextmulti').setLabel('Next').setStyle(ButtonStyle.Success)
                    )]});
                    ms.edit({embeds: [new EmbedBuilder().setColor('Blue').setDescription('How much entry multiplier you wanna give ??')]});

                    await interaction.channel.awaitMessages({
                        filter: (i)=> i.author.id == interaction.user.id,
                        idle: 60000,
                        max: 1
                    }).then(async collected => {
                        let got = collected.first();
                        if(!got){
                            ms.edit({embeds: [gembed.setDescription('Cancelled').setFooter(null)]});
                            can = true;
                            return;
                        }
                        if(Number(got.content) && Number.isInteger(Number(got.content)) && Number(got.content) > 0) entries = Number(got.content);
                        got.delete().catch(e => null);
                    });

                    if(can) return await interaction.editReply({components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('gaw-addmulti').setLabel('Add Multiplier').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('gaw-rmvmulti').setLabel('Remove Multiplier').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-nextmulti').setLabel('Next').setStyle(ButtonStyle.Success)
                    )]});
                    ms.delete().catch(e => null);
                    multi.set(role.id, entries);

                    // RELOAD -------------------------------------------
                    let desc = '';

                    multi.forEach(function(value, key){
                        desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
                    });
                
                    await interaction.editReply({
                        embeds: [gembed
                .setDescription(`
${emoji.point} **Basic Details**
${emoji.blankspace}${emoji.replyc} Prize: **${prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerCount}
${emoji.blankspace}${emoji.replyc} Ends: <t:${((Date.now() + time)/1000).toFixed(0)}>  [<t:${((Date.now() + time)/1000).toFixed(0)}:R>]
${emoji.blankspace}${emoji.replyc} Channel: ${channel}
${emoji.blankspace}${emoji.replyc} Host: ${host}
${emoji.blankspace}${emoji.reply} Ends at ${limit} Entries
                
${emoji.point} **Multiplier**
${desc.length == 0?`${emoji.blankspace}${emoji.reply} No Multiplier has been added`:desc}
`)],
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('gaw-addmulti').setLabel('Add Multiplier').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('gaw-rmvmulti').setLabel('Remove Multiplier').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-nextmulti').setLabel('Next').setStyle(ButtonStyle.Success),
                        )]
                    });

                } else if(i.customId == 'gaw-rmvmulti'){
                    i.deferUpdate();
                    await interaction.editReply({components: []});
                    var can = false;

                    let ms = await interaction.followUp({embeds: [new EmbedBuilder().setColor('Blue').setDescription('Kindly Mention a Role or provide the Role ID, of the Role you wanna remove from Multiplier')]})
                    await interaction.channel.awaitMessages({
                        filter: (m) => m.author.id == interaction.user.id,
                        idle: 60000,
                        max: 1
                    }).then(async collected => {
                        let got = collected.first();
                        if(!got){
                            ms.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('No response')]});
                            can = true;
                            return
                        };
                        role = got.mentions.roles.first() || interaction.guild.roles.cache.get(got.content);
                        if(!role){
                            got.delete().catch(e => null);
                            ms.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('No response')]});
                            can = true;
                            return;
                        }
                        got.delete().catch(e => null);

                        if(!multi.has(role.id)){
                            ms.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('No response')]});
                            can = true;
                            return;
                        }
                        multi.delete(role.id);
                    });
                    if(can) return await interaction.editReply({components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('gaw-addmulti').setLabel('Add Multiplier').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('gaw-rmvmulti').setLabel('Remove Multiplier').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-nextmulti').setLabel('Next').setStyle(ButtonStyle.Success),
                    )]});
                    ms.delete().catch(e => null);

                    // RELOAD -------------------------------------------
                    let desc = '';

                    multi.forEach(function(value, key){
                        desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
                    });
                
                    await interaction.editReply({
                        embeds: [gembed
                .setDescription(`
${emoji.point} **Basic Details**
${emoji.blankspace}${emoji.replyc} Prize: **${prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerCount}
${emoji.blankspace}${emoji.replyc} Ends: <t:${((Date.now() + time)/1000).toFixed(0)}>  [<t:${((Date.now() + time)/1000).toFixed(0)}:R>]
${emoji.blankspace}${emoji.replyc} Channel: ${channel}
${emoji.blankspace}${emoji.replyc} Host: ${host}
${emoji.blankspace}${emoji.reply} Ends at ${limit} Entries
                
${emoji.point} **Multiplier**
${desc.length == 0?`${emoji.blankspace}${emoji.reply} No Multiplier has been added`:desc}
`)],
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('gaw-addmulti').setLabel('Add Multiplier').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('gaw-rmvmulti').setLabel('Remove Multiplier').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-nextmulti').setLabel('Next').setStyle(ButtonStyle.Success),
                        )]
                    });
                } else if(i.customId == 'gaw-nextmulti'){
                    i.deferUpdate();
                    let desc = '';

                    multi.forEach(function(value, key){
                        desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
                    });
                    await interaction.editReply({embeds: [gembed
                        .setDescription(`
${emoji.point} **Basic Details**
${emoji.blankspace}${emoji.replyc} Prize: **${prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerCount}
${emoji.blankspace}${emoji.replyc} Ends: <t:${((Date.now() + time)/1000).toFixed(0)}>  [<t:${((Date.now() + time)/1000).toFixed(0)}:R>]
${emoji.blankspace}${emoji.replyc} Channel: ${channel}
${emoji.blankspace}${emoji.replyc} Host: ${host}
${emoji.blankspace}${emoji.reply} Ends at ${limit} Entries
                        
${emoji.point} **Multiplier**
${desc.length == 0?`${emoji.blankspace}${emoji.reply} No Multiplier has been added\n`:desc}
${emoji.point} **Requirements**
${emoji.blankspace}${emoji.reply} No Requirements has been added
`)], components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('gaw-addreq').setLabel('Add Requirements').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('gaw-rmvreq').setLabel('Remove Requirements').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-nextreq').setLabel('Start').setEmoji('🎉').setStyle(ButtonStyle.Success),
                    )]});
 
                } else if(i.customId == 'gaw-cancel'){
                    i.deferUpdate();
                    interaction.editReply({embeds: [gembed.setFooter({text: 'Creation has been cancelled'})]});
                    collector.stop();
                } else if(i.customId == 'gaw-addreq'){
                    i.deferUpdate();
                    await interaction.editReply({components: []});
                    var type = null;
                    var det = [];
                    var can = false;

                    let msg = await interaction.followUp({embeds: [new EmbedBuilder().setColor('Red').setDescription('Kindly Select the type from below')], components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('gawreq1').setLabel('Required Roles').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gawreq2').setLabel('Forbidden Roles').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gawreq3').setLabel('Join Goal').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gawreq4').setLabel('Account Age').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gawreq5').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                    )], fetchReply: true});
                    await msg.awaitMessageComponent({filter: (i) => i.user.id == interaction.user.id, time: 45000})
                    .catch(async e => {
                        can = true;
                        msg.delete().catch(e => null);
                        await interaction.editReply({components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('gaw-addreq').setLabel('Add Requirements').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('gaw-rmvreq').setLabel('Remove Requirements').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-nextreq').setLabel('Start').setEmoji('🎉').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                        )]});
                    })
                    .then(async i => {
                        if(i.customId == 'gawreq1'){
                            i.deferUpdate();
                            type = 'role';
                        } else if(i.customId == 'gawreq2'){
                            i.deferUpdate();
                            type = 'blackrole';
                        } else if(i.customId == 'gawreq3') {
                            i.deferUpdate();
                            type = 'join';
                        } else if(i.customId == 'gawreq4') {
                            i.deferUpdate();
                            type = 'age';
                        } else if(i.customId == 'gawreq5') {
                            i.deferUpdate();
                            type = 'cancel';
                        }
                    });

                    msg.edit({components: []});

                    if(!type || type == null) {
                        msg.delete().catch(e => null);
                        await interaction.editReply({components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('gaw-addreq').setLabel('Add Requirements').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('gaw-rmvreq').setLabel('Remove Requirements').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-nextreq').setLabel('Start').setEmoji('🎉').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                        )]});
                        can = true;
                    } else if (type == 'role') {
                        msg.edit({embeds: [new EmbedBuilder().setColor('Gold').setDescription('Kindly mention or provide the ID of the Role')]});
                    } else if (type == 'blackrole') {
                        msg.edit({embeds: [new EmbedBuilder().setColor('Gold').setDescription('Kindly mention or provide the ID of the Role')]});
                    } else if (type == 'join') {
                        msg.edit({embeds: [new EmbedBuilder().setColor('Gold').setDescription('How long should a Member stay in the Server to Join the Giveaway ?')]});
                    } else if (type == 'age') {
                        msg.edit({embeds: [new EmbedBuilder().setColor('Gold').setDescription(`How much old should a Member's Account should be to Join the Giveaway`)]});
                    } else {
                        msg.delete().catch(e => null);
                        await interaction.editReply({components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('gaw-addreq').setLabel('Add Requirements').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('gaw-rmvreq').setLabel('Remove Requirements').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-nextreq').setLabel('Start').setEmoji('🎉').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                        )]});
                        can = true;
                    }

                    if(can){
                        await interaction.editReply({components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('gaw-addreq').setLabel('Add Requirements').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('gaw-rmvreq').setLabel('Remove Requirements').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('gaw-nextreq').setLabel('Start').setEmoji('🎉').setStyle(ButtonStyle.Success),
                        )]});
                        msg.delete().catch(e => null);
                        return;
                    }

                    await interaction.channel.awaitMessages({
                        filter: (m) => m.author.id == interaction.user.id,
                        idle: 60000,
                        max: 1
                    }).then(async collected => {
                        let got = collected.first();
                        if(!got){
                            msg.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('No response')]});
                            can = true;
                            return
                        };

                        if (type == 'role') {
                            role = got.mentions.roles.first() || interaction.guild.roles.cache.get(got.content);
                            if(!role){
                                got.delete().catch(e => null);
                                msg.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('Invalid Response')]});
                                can = true;
                                return;
                            }
                            if(req.has('role')){
                                let l = req.get('role');
                                l.push(role.id);
                                req.set('role', l);
                            } else {
                                req.set('role', [role.id])
                            }
                            got.delete().catch(e => null);
                        } else if (type == 'blackrole') {
                            role = got.mentions.roles.first() || interaction.guild.roles.cache.get(got.content);
                            if(!role){
                                got.delete().catch(e => null);
                                msg.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('Invalid response')]});
                                can = true;
                                return;
                            }
                            if(req.has('blackrole')){
                                let l = req.get('blackrole');
                                l.push(role.id);
                                req.set('blackrole', l);
                            } else {
                                req.set('blackrole', [role.id])
                            }
                            got.delete().catch(e => null);
                        } else if (type == 'join') {
                            if(!ms(got.content) || ms(got.content) < 0){
                                got.delete().catch(e => null);
                                msg.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('Invalid Input')]})
                                can = true;
                                return;
                            }
                            req.set('join', ms(got.content))
                            got.delete().catch(e => null);
                        } else if (type == 'age') {
                            if(!ms(got.content) || ms(got.content) < 0){
                                got.delete().catch(e => null);
                                msg.edit({embeds:[new EmbedBuilder().setColor('Red').setDescription('Invalid Input')]})
                                can = true;
                                return;
                            }
                            req.set('age', ms(got.content));
                            got.delete().catch(e => null);
                        }
                        msg.delete().catch(e => null);
                    });

                    // RELOAD
                    let desc = '';

                    multi.forEach(function(value, key){
                        desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
                    });

                    let desc2 = '';
                    let rolelist = [];
                    let brolelist = [];
                    req.forEach(function(value, key){
                        if(key == 'role') {
                            value.forEach(i => rolelist.push(interaction.guild.roles.cache.get(i)))
                        }
                        if(key == 'blackrole') {
                            value.forEach(i => brolelist.push(interaction.guild.roles.cache.get(i)))
                        }
                        if(key == 'join') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: You should have stayed for more than ${ms(value)} in this server\n`;
                        if(key == 'age') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Your Account should be older than ${ms(value)}\n`;
                    });
                
                    if(rolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Any of the Required Role(s) - ${rolelist.join(', ')}\n`;
                    if(brolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Blacklisted Role(s) - ${brolelist.join(', ')}\n`

                    await interaction.editReply({embeds: [gembed
                        .setDescription(`
${emoji.point} **Basic Details**
${emoji.blankspace}${emoji.replyc} Prize: **${prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerCount}
${emoji.blankspace}${emoji.replyc} Ends: <t:${((Date.now() + time)/1000).toFixed(0)}>  [<t:${((Date.now() + time)/1000).toFixed(0)}:R>]
${emoji.blankspace}${emoji.replyc} Channel: ${channel}
${emoji.blankspace}${emoji.replyc} Host: ${host}
${emoji.blankspace}${emoji.reply} Ends at ${limit} Entries
                        
${emoji.point} **Multiplier**
${desc.length == 0?`${emoji.blankspace}${emoji.reply} No Multiplier has been added\n`:desc}
${emoji.point} **Requirements**
${desc2.length == 0?`${emoji.blankspace}${emoji.reply} No Requirements has been added`:desc2}
`)], components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('gaw-addreq').setLabel('Add Requirements').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('gaw-rmvreq').setLabel('Remove Requirements').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-nextreq').setLabel('Start').setEmoji('🎉').setStyle(ButtonStyle.Success),
                    )]});

                } else if(i.customId == 'gaw-rmvreq'){
                    i.deferUpdate();
                    await interaction.editReply({components: []});

                    var type = null;
                    var det = [];
                    var can = false;

                    let msg = await interaction.followUp({embeds: [new EmbedBuilder().setColor('Red').setDescription('Kindly Select the type from below')], components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('gawreq1').setLabel('Required Roles').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gawreq2').setLabel('Forbidden Roles').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gawreq3').setLabel('Join Goal').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gawreq4').setLabel('Account Age').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gawreq5').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                    )], fetchReply: true});

                    await msg.awaitMessageComponent({filter: (i) => i.user.id == interaction.user.id, time: 45000})
                    .catch(async e => {
                        can = true;
                        msg.delete().catch(e => null);
                        await interaction.editReply({components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('gaw-addreq').setLabel('Add Requirements').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('gaw-rmvreq').setLabel('Remove Requirements').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('gaw-nextreq').setLabel('Start').setEmoji('🎉').setStyle(ButtonStyle.Success),
                        )]});
                    })
                    .then(async i => {
                        if(i.customId == 'gawreq1'){
                            i.deferUpdate();
                            type = 'role';
                        } else if(i.customId == 'gawreq2'){
                            i.deferUpdate();
                            type = 'blackrole';
                        } else if(i.customId == 'gawreq3') {
                            i.deferUpdate();
                            type = 'join';
                        } else if(i.customId == 'gawreq4') {
                            i.deferUpdate();
                            type = 'age';
                        } else if(i.customId == 'gawreq5') {
                            i.deferUpdate();
                            type = 'cancel';
                        }
                    });

                    if(can || type == 'cancel'){
                        msg.delete().catch(e => null);
                        return await interaction.editReply({components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('gaw-addreq').setLabel('Add Requirements').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('gaw-rmvreq').setLabel('Remove Requirements').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('gaw-nextreq').setLabel('Start').setEmoji('🎉').setStyle(ButtonStyle.Success),
                        )]});
                    } 

                    if(req.has(type)){
                        req.delete(type);
                        msg.delete().catch(e => null)
                    } else {
                        msg.edit({embeds: [new EmbedBuilder().setColor('Gold').setDescription('No such requirement has been added')], components: []});
                    };

                    // RELOAD
                    let desc = '';

                    multi.forEach(function(value, key){
                        desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
                    });

                    let desc2 = '';
                    let rolelist = [];
                    let brolelist = [];
                    req.forEach(function(value, key){
                        if(key == 'role') {
                            value.forEach(i => rolelist.push(interaction.guild.roles.cache.get(i)))
                        }
                        if(key == 'blackrole') {
                            value.forEach(i => brolelist.push(interaction.guild.roles.cache.get(i)))
                        }
                        if(key == 'join') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: You should have stayed for more than ${ms(value)} in this server\n`;
                        if(key == 'age') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Your Account should be older than ${ms(value)}\n`;
                    });
                
                    if(rolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Any of the Required Role(s) - ${rolelist.join(', ')}\n`;
                    if(brolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Blacklisted Role(s) - ${brolelist.join(', ')}\n`

                    await interaction.editReply({embeds: [gembed
                        .setDescription(`
${emoji.point} **Basic Details**
${emoji.blankspace}${emoji.replyc} Prize: **${prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerCount}
${emoji.blankspace}${emoji.replyc} Ends: <t:${((Date.now() + time)/1000).toFixed(0)}>  [<t:${((Date.now() + time)/1000).toFixed(0)}:R>]
${emoji.blankspace}${emoji.replyc} Channel: ${channel}
${emoji.blankspace}${emoji.replyc} Host: ${host}
${emoji.blankspace}${emoji.reply} Ends at ${limit} Entries
                        
${emoji.point} **Multiplier**
${desc.length == 0?`${emoji.blankspace}${emoji.reply} No Multiplier has been added\n`:desc}
${emoji.point} **Requirements**
${desc2.length == 0?`${emoji.blankspace}${emoji.reply} No Requirements has been added`:desc2}
`)], components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('gaw-addreq').setLabel('Add Requirements').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('gaw-rmvreq').setLabel('Remove Requirements').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('gaw-nextreq').setLabel('Start').setEmoji('🎉').setStyle(ButtonStyle.Success),
                    )]});
                } else if(i.customId == 'gaw-nextreq'){
                    i.deferUpdate();
                    var canc = false;
                    let desc = '';
                    let desc2 = '';
                    let rolelist = [];
                    let brolelist = [];

                    multi.forEach(function(value, key){
                        desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
                    });

                    req.forEach(function(value, key){
                        if(key == 'role') {
                            value.forEach(i => rolelist.push(interaction.guild.roles.cache.get(i)))
                        }
                        if(key == 'blackrole') {
                            value.forEach(i => brolelist.push(interaction.guild.roles.cache.get(i)))
                        }
                        if(key == 'join') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: You should have stayed for more than ${ms(value)} in this server\n`;
                        if(key == 'age') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Your Account should be older than ${ms(value)}\n`;
                    });
                
                    if(rolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Any of the Required Role(s) - ${rolelist.join(', ')}\n`;
                    if(brolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Blacklisted Role(s) - ${brolelist.join(', ')}\n`;

                    let button = new ButtonBuilder().setCustomId('gaw-enter').setStyle(ButtonStyle.Success).setLabel('0').setEmoji(config.emote.startsWith('<:')?config.emote:'🎉');
                    let gmsg = await channel.send({content: `${config.pingrole != null?`<@&${config.pingrole}>`:''}${config.gawmsg != null?': '.concat(config.gawmsg):''}`,embeds: [new EmbedBuilder().setColor(config.color || '#ff4c0a').setAuthor({name: `${interaction.guild.name} Giveaways`}).setImage(config.banner || null)
                        .setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${prize}**
${emoji.blankspace}${emoji.replyc} No. of Winners: ${winnerCount}
${emoji.blankspace}${emoji.replyc} Host: ${host} ${limit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry will stop at ${limit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: <t:${((Date.now() + time)/1000).toFixed(0)}>  [<t:${((Date.now() + time)/1000).toFixed(0)}:R>]
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`)], components: [new ActionRowBuilder().addComponents(button)], allowedMentions: {parse: ['roles']}
                    }).catch(e => {
                        canc = true;
                        interaction.followUp({embeds: [new EmbedBuilder().setColor('Green').setDescription('I am missing permission to host giveaway there')]});
                    });

                    if(canc) return;

                    let gentry = await gawModel.create({
                        msgid: gmsg.id,
                        serverID: interaction.guildId,
                        status: true,
                        chId: channel.id,
                        host: host.id,
                        prize: prize,
                        winCount: winnerCount,
                        endtime: Date.now() + time,
                        req: req,
                        multi: multi,
                        entrylimit: limit
                    });

                    gentry.save();

                    interaction.editReply({embeds: [gembed.setTitle(null).setDescription('Giveaway has been started').setThumbnail(null).setFooter(null)], components: []});

                    // Ending..
            setTimeout(async () => {
                let id = gmsg.id;
                if(!id) return;
    
                let entry = await gawModel.findOne({msgid: id, serverID: interaction.guildId});
                if(!entry) return;
    
                if(!entry.status) return;
    
                await interaction.guild.channels.cache.get(entry.chId).messages.fetch(entry.msgid).catch(e => null);
    
                const {multi, req} = entry;
                let desc = '';
                let desc2 = '';
                let rolelist = [];
                let brolelist = [];
    
                multi.forEach(function(value, key){
                    desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
                });
    
                req.forEach(function(value, key){
                    if(key == 'role') {
                        value.forEach(i => rolelist.push(interaction.guild.roles.cache.get(i)))
                    }
                    if(key == 'blackrole') {
                        value.forEach(i => brolelist.push(interaction.guild.roles.cache.get(i)))
                    }
                    if(key == 'join') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: You should have stayed for more than ${ms(value)} in this server\n`;
                    if(key == 'age') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Your Account should be older than ${ms(value)}\n`;
                });
            
                if(rolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Any of the Required Role(s) - ${rolelist.join(', ')}\n`;
                if(brolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Blacklisted Role(s) - ${brolelist.join(', ')}\n`;
    
                let msg = interaction.guild.channels.cache.get(entry.chId).messages.cache.get(entry.msgid);
                if(!msg) return;

                if(!entry.entries || entry.entries?.length == 0){
                    await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${entry.prize}**
${emoji.blankspace}${emoji.replyc} Winners: 
${emoji.blankspace}${emoji.replyc} Host: <@${entry.host}> ${entry.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${entry.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: Giveaway Cancelled
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`).setFooter({text: 'Giveaway has been cancelled due to no participation'})]});
                    entry.status = false;
                    entry.save();
                    return;
                }
    
                // Drawing winner(s)
                let list = entry.entries;
                var winnerId = ``;
                let winners = [];
                let no = Number(entry.winCount) || 1;
                try{
                    for (let i = 0; i < no && list?.length != 0; i++){
                        let rid = list[Math.floor(Math.random() * list?.length)];
                        if(winnerId.length == 0) winnerId = winnerId + `<@${rid}>`;
                        else winnerId = winnerId + `, <@${rid}>`;

                        winners.push(rid);
                        entry.winners.push(rid);

                        let r = [];
                        list.forEach(x => {
                            if(x != rid) r.push(x)
                        });
                        list = r;
                    };
                } catch (error){};

                let role = interaction.guild.roles.cache.get(config.winrole);
                winners.forEach(async i => {
                    if (role) {
                        await interaction.guild.members.fetch(i).catch(e => null);
                        await interaction.guild.members.cache.get(i).roles.add(role, 'Giveaway Winner Role').catch(e => null);
                    }
                });
    
                await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setFooter({text:`Giveaway has been ended.`}).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${entry.prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerId.length != 0?winnerId:'\`Error came\` :skull:'}
${emoji.blankspace}${emoji.replyc} Host: <@${entry.host}> ${entry.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${entry.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: <t:${((Date.now())/1000).toFixed(0)}>  [<t:${((Date.now())/1000).toFixed(0)}:R>]
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`)]});
    
                entry.status = false;
                entry.save();
    
                msg.channel.send({content: `${config.emote} Congratulations, ${winnerId}! You won **${entry.prize}** ${config.emote}`, embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription(`[**Link to Giveaway**](${msg.url})`)]}).catch(e => null);
            }, time);
                }
            });
        } 

    // ANOTHER SUB COMMAD -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
        else if(interaction.options.getSubcommand() == 'end'){
            await interaction.deferReply();
            let id = interaction.options.getString('giveaway_id');
            if(!id) {
                await interaction.editReply({embeds :[new EmbedBuilder().setColor('Gold').setDescription('Id is not present')]});
                return;
            }

            let entry = await gawModel.findOne({msgid: id, serverID: interaction.guildId});
            if(!entry){
                await interaction.editReply({embeds :[new EmbedBuilder().setColor('Gold').setDescription('There is no such giveaway running with this ID or has been removed from our database')]});
                return;
            }

            if(!entry.status){
                await interaction.editReply({embeds :[new EmbedBuilder().setColor('Gold').setTitle('Giveaway already Ended').setDescription('Wanna change the winner(s)?, try rerolling the giveaway')]});
                return;
            }

            await interaction.guild.channels.cache.get(entry.chId).messages.fetch(entry.msgid).catch(e => null);

            const {multi, req} = entry;
            let desc = '';
            let desc2 = '';
            let rolelist = [];
            let brolelist = [];

            multi.forEach(function(value, key){
                desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
            });

            req.forEach(function(value, key){
                if(key == 'role') {
                    value.forEach(i => rolelist.push(interaction.guild.roles.cache.get(i)))
                }
                if(key == 'blackrole') {
                    value.forEach(i => brolelist.push(interaction.guild.roles.cache.get(i)))
                }
                if(key == 'join') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: You should have stayed for more than ${ms(value)} in this server\n`;
                if(key == 'age') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Your Account should be older than ${ms(value)}\n`;
            });
        
            if(rolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Any of the Required Role(s) - ${rolelist.join(', ')}\n`;
            if(brolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Blacklisted Role(s) - ${brolelist.join(', ')}\n`;

            let msg = interaction.guild.channels.cache.get(entry.chId).messages.cache.get(entry.msgid);
            if(!msg){
                await interaction.editReply({embeds :[new EmbedBuilder().setColor('Gold').setDescription('There is no such giveaway running with this ID or has been removed from our database')]});
                return;
            }
            if(!entry.entries || entry.entries?.length == 0){
                await interaction.deleteReply().catch(e => null);
                
                await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${entry.prize}**
${emoji.blankspace}${emoji.replyc} Winners: 
${emoji.blankspace}${emoji.replyc} Host: <@${entry.host}> ${entry.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${entry.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: Giveaway Cancelled
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`).setFooter({text: 'Giveaway has been cancelled due to no participation'})]});
                entry.status = false;
                entry.save();         
                return;
            }

            // Drawing winner(s)
            let list = entry.entries;
            var winnerId = ``;
            let winners = [];
            let no = Number(entry.winCount) || 1;
            try{
                for (let i = 0; i < no && list?.length != 0; i++){
                    let rid = list[Math.floor(Math.random() * list?.length)];
                    if(winnerId.length == 0) winnerId = winnerId + `<@${rid}>`;
                    else winnerId = winnerId + `, <@${rid}>`;

                    winners.push(rid);
                    entry.winners.push(rid);

                    let r = [];
                    list.forEach(x => {
                        if(x != rid) r.push(x)
                    });
                    list = r;
                };
            } catch (error){};

            let role = interaction.guild.roles.cache.get(config.winrole);
            winners.forEach(async i => {
                if (role) {
                    await interaction.guild.members.fetch(i).catch(e => null);
                    await interaction.guild.members.cache.get(i).roles.add(role, 'Giveaway Winner Role').catch(e => null);
                }
            });

            await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setFooter({text:`Giveaway has been ended.`}).setDescription(`
**Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${entry.prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerId.length != 0?winnerId:'\`Error came\` :skull:'}
${emoji.blankspace}${emoji.replyc} Host: <@${entry.host}> ${entry.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${entry.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: <t:${((Date.now())/1000).toFixed(0)}>  [<t:${((Date.now())/1000).toFixed(0)}:R>]
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`)]});

            entry.status = false;
            entry.save();

            msg.channel.send({content: `${config.emote} Congratulations, ${winnerId}! You won **${entry.prize}** ${config.emote}`, embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription(`[**Link to Giveaway**](${msg.url})`)]}).catch(e => null);

            interaction.editReply({embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription('Successfully ended the Giveaway.')]});
        }
    // ANOTHER SUB COMMAND =-=-=-=-=-=-=-=
        else if(interaction.options.getSubcommand() == 'reroll'){
            await interaction.deferReply();
            let id = interaction.options.getString('giveaway_id');
            if(!id) {
                await interaction.editReply({embeds :[new EmbedBuilder().setColor('Gold').setDescription('Id is not present')]});
                return;
            }

            let entry = await gawModel.findOne({msgid: id, serverID: interaction.guildId});
            if(!entry){
                await interaction.editReply({embeds :[new EmbedBuilder().setColor('Gold').setDescription('There is no such giveaway running with this ID or has been removed from our database')]});
                return;
            }

            if(entry.status){
                await interaction.editReply({embeds :[new EmbedBuilder().setColor('Gold').setTitle('Giveaway is still running').setDescription('Wanna roll winner(s)?, try to end the giveaway')]});
                return;
            }

            await interaction.guild.channels.cache.get(entry.chId).messages.fetch(entry.msgid).catch(e => null);

            const {multi, req} = entry;
            let desc = '';
            let desc2 = '';
            let rolelist = [];
            let brolelist = [];

            multi.forEach(function(value, key){
                desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
            });

            req.forEach(function(value, key){
                if(key == 'role') {
                    value.forEach(i => rolelist.push(interaction.guild.roles.cache.get(i)))
                }
                if(key == 'blackrole') {
                    value.forEach(i => brolelist.push(interaction.guild.roles.cache.get(i)))
                }
                if(key == 'join') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: You should have stayed for more than ${ms(value)} in this server\n`;
                if(key == 'age') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Your Account should be older than ${ms(value)}\n`;
            });
        
            if(rolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Any of the Required Role(s) - ${rolelist.join(', ')}\n`;
            if(brolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Blacklisted Role(s) - ${brolelist.join(', ')}\n`;

            let msg = interaction.guild.channels.cache.get(entry.chId).messages.cache.get(entry.msgid);
            if(!msg){
                await interaction.editReply({embeds :[new EmbedBuilder().setColor('Gold').setDescription('There is no such giveaway running with this ID or has been removed from our database')]});
                return;
            }
            
            if(entry.winners?.length > 0){
                let role1 = interaction.guild.roles.cache.get(config.winrole);
                if(role1){
                    entry.winners.forEach(async i => {
                        await interaction.guild.members.fetch(i).catch(e => null);
                        await interaction.guild.members.cache.get(i).roles.remove(role, 'Giveaway Re rolled').catch(e => null);
                    });
                }
            }

            // Drawing winner(s)
            let list = entry.entries;
            var winnerId = ``;
            let winners = [];
            let no = Number(entry.winCount) || 1;
            try{
                for (let i = 0; i < no && list?.length != 0; i++){
                    let rid = list[Math.floor(Math.random() * list?.length)];
                    if(winnerId.length == 0) winnerId = winnerId + `<@${rid}>`;
                    else winnerId = winnerId + `, <@${rid}>`;

                    winners.push(rid);
                    entry.winners.push(rid);

                    let r = [];
                    list.forEach(x => {
                        if(x != rid) r.push(x)
                    });
                    list = r;
                };
            } catch (error){};

            let role = interaction.guild.roles.cache.get(config.winrole);
            winners.forEach(async i => {
                if (role) {
                    await interaction.guild.members.fetch(i).catch(e => null);
                    await interaction.guild.members.cache.get(i).roles.add(role, 'Giveaway Winner Role').catch(e => null);
                }
            });

            await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setFooter({text:`Giveaway has been ended.`}).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${entry.prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerId.length != 0?winnerId.concat(' *(rerolled)*'):'\`Error came\` :skull:'}
${emoji.blankspace}${emoji.replyc} Host: <@${entry.host}> ${entry.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${entry.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Rerolled: <t:${((Date.now())/1000).toFixed(0)}>  [<t:${((Date.now())/1000).toFixed(0)}:R>]
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`)]});

            entry.status = false;
            entry.save();

            msg.channel.send({content: `${config.emote} Congratulations, ${winnerId}! You won **${entry.prize}** ${config.emote} *[rerolled]*`, embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription(`[**Link to Giveaway**](${msg.url})`)]}).catch(e => null);

            interaction.editReply({embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription('Successfully rerolled winners of the Giveaway.')]});
        }

        else if(interaction.options.getSubcommand() == 'active_list'){
            await interaction.deferReply({fetchReply: true});
            let allgaws = await gawModel.find({serverID: interaction.guildId, status: true}).then(gaws => gaws.map(entry => `
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${entry.prize}**
${emoji.blankspace}${emoji.replyc} Host: <@${entry.host}> ${entry.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${entry.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.replyc} Link: [Giveaway Link](https://discord.com/channels/${interaction.guildId}/${entry.chId}/${entry.msgid})
${emoji.blankspace}${emoji.reply} Ends: <t:${((entry.endtime)/1000).toFixed(0)}>  [<t:${((entry.endtime)/1000).toFixed(0)}:R>]
`));
            if(allgaws.length == 0){
                interaction.editReply({embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription(`There is no Giveaway running`).setTitle(`${interaction.guild.name} Giveaways List`)]});
                return;
            }

            let currentPage = 0;
            let embeds = [];
            
            if(Array.isArray(allgaws)){
                let k = 1;
                let n = 0;
                for (let i = 0; i < allgaws.length; i += 1) {
                    const current = allgaws.slice(i, k);
                    k += 1;
                    n++;
                    const embed = new EmbedBuilder()
                        .setDescription(current.join("\n"))
                        .setTitle(`[${allgaws.length}] ${interaction.guild.name} Giveaways List`)
                        .setFooter({text:`Page ${n}/${(allgaws.length)} `,iconURL: client.user.displayAvatarURL()})
                        .setColor(`Gold`)
                    embeds.push(embed);
                }
            } else {
                await interaction.deleteReply().catch(e => null);
            }

            if (embeds.length === 1) return interaction.editReply({embeds: [embeds[0]]}).catch(e => null);

            let button_back = new ButtonBuilder()
                .setStyle(ButtonStyle.Primary)
                .setCustomId('ba1')
                .setEmoji("<:leftarrow:1033319900166500352>")
                .setDisabled(false)
            let button_forward = new ButtonBuilder()
                .setStyle(ButtonStyle.Primary)
                .setCustomId('ba3')
                .setEmoji('<:right:1033330862831452241>')
                .setDisabled(false)
            let button_stop = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId('bastop')
                .setEmoji("🛑")
        
            //message
            let swapmsg = await interaction.editReply({
                embeds: [embeds[0]], 
                components: [new ActionRowBuilder().addComponents([button_back.setDisabled(), button_stop, button_forward])]
            });
            const collector = swapmsg.createMessageComponentCollector({filter: (i) => i?.isButton() && i?.user && i?.message.author.id == client.user.id, time: 30e3 }); //collector for 5 seconds
            //array of all embeds, here simplified just 10 embeds with numbers 0 - 9
            collector.on('collect', async b => {
                collector.resetTimer();
                if(b?.user.id !== interaction.user.id)
                return b?.reply({content: `<a:Cross_Animated:962854034098757714> You are not allowed to use these Buttons!`, ephemeral: true})
                    //page forward
                if(b?.customId == "ba1") {
                    if (currentPage !== 0) {
                        currentPage -= 1
                        await swapmsg.edit({embeds: [embeds[currentPage]], components: [new ActionRowBuilder().addComponents([button_back.setDisabled(false), button_stop, button_forward.setDisabled(false)])]}).catch(() => {});
                        if(currentPage == 0) await swapmsg.edit({components: [new ActionRowBuilder().addComponents([button_back.setDisabled(), button_stop, button_forward.setDisabled(false)])]}).catch(() => {});
                        await b?.deferUpdate();
                    } else {
                        b?.deferUpdate();
                    }
                } else if(b?.customId == "ba2"){
                    currentPage = embeds.length - 1;
                    await swapmsg.edit({embeds: [embeds[currentPage]], components: [new ActionRowBuilder().addComponents([button_back.setDisabled(false), button_stop, button_forward.setDisabled()])]}).catch(() => {});
                    await b?.deferUpdate();
                } else if(b?.customId == "ba4"){
                    currentPage = 0;
                    await swapmsg.edit({embeds: [embeds[currentPage]], components: [new ActionRowBuilder().addComponents([button_back.setDisabled(), button_stop, button_forward.setDisabled(false)])]}).catch(() => {});
                    await b?.deferUpdate();
                } else if(b?.customId == "ba3"){
                    if (currentPage < embeds.length - 1) {
                        currentPage++;
                        await swapmsg.edit({embeds: [embeds[currentPage]], components: [new ActionRowBuilder().addComponents([button_back.setDisabled(false), button_stop, button_forward.setDisabled(false)])]}).catch(() => {});
                        if(currentPage == embeds.length - 1) await swapmsg.edit({components: [new ActionRowBuilder().addComponents([button_back.setDisabled(false), button_stop, button_forward.setDisabled()])]}).catch(() => {});
                        await b?.deferUpdate();
                    } else {
                        await b?.deferUpdate();
                    }
                    
                } else if(b?.customId == "bastop"){
                    await b?.deferUpdate();
                    collector.stop();
                }
            });
            collector.on("end", async (collected, reason) => {
                await swapmsg.edit({embeds: [embeds[currentPage]], components: [new ActionRowBuilder().addComponents([button_back.setDisabled(), button_stop.setDisabled(), button_forward.setDisabled()])]}).catch(() => {});
            });
        }
        else if(interaction.options.getSubcommand() == 'drop'){
            await interaction.deferReply({fetchReply: true});
            var prize = interaction.options.getString('prize');
            var time = ms(interaction.options.getString('duration')) || 60*60*1000;
            if(time < 10*1000) time = 60*1000;
            var host = interaction.member;
            var channel = interaction.options.getChannel('channel') || interaction.channel;
            var winnerCount = interaction.options.getNumber('winner_count') || 1;
            if(winnerCount < 0) winnerCount = 1;
            var canc = false;

            let button = new ButtonBuilder().setCustomId('gaw-enter').setStyle(ButtonStyle.Success).setLabel('0').setEmoji(config.emote.startsWith('<:')?config.emote:'🎉');
            let gmsg = await channel.send({content: `${config.pingrole != null?`<@&${config.pingrole}>`:''}${config.gawmsg != null?': '.concat(config.gawmsg):''}`,embeds: [new EmbedBuilder().setColor(config.color || '#ff4c0a').setAuthor({name: `${interaction.guild.name} Giveaways`}).setImage(config.banner || null)
                .setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${prize}**
${emoji.blankspace}${emoji.replyc} No. of Winners: ${winnerCount}
${emoji.blankspace}${emoji.replyc} Host: ${host}
${emoji.blankspace}${emoji.reply} Ends: <t:${((Date.now() + time)/1000).toFixed(0)}>  [<t:${((Date.now() + time)/1000).toFixed(0)}:R>]
`)], components: [new ActionRowBuilder().addComponents(button)], allowedMentions: {parse: ['roles']}
            }).catch(e => {
                canc = true;
                interaction.followUp({embeds: [new EmbedBuilder().setColor('Green').setDescription('I am missing permission to host giveaway there')]});
            });

            if(canc) return;

            let gentry = await gawModel.create({
                msgid: gmsg.id,
                serverID: interaction.guildId,
                status: true,
                chId: channel.id,
                host: host.id,
                prize: prize,
                winCount: winnerCount,
                endtime: Date.now() + time,
                req: {},
                multi: {},
                entrylimit: 'infinite'
            });

            gentry.save();

            interaction.editReply({embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription('Giveaway has been started')], components: []});

            // Ending..
            setTimeout(async () => {
                let id = gmsg.id;
                if(!id) return;

                let entry = await gawModel.findOne({msgid: id, serverID: interaction.guildId});
                if(!entry) return;

                if(!entry.status) return;

                await interaction.guild.channels.cache.get(entry.chId).messages.fetch(entry.msgid).catch(e => null);

                const {multi, req} = entry;
                let desc = '';
                let desc2 = '';
                let rolelist = [];
                let brolelist = [];

                multi.forEach(function(value, key){
                    desc = desc + `${emoji.blankspace} :white_medium_small_square: ${interaction.guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
                });

                req.forEach(function(value, key){
                    if(key == 'role') {
                        value.forEach(i => rolelist.push(interaction.guild.roles.cache.get(i)))
                    }
                    if(key == 'blackrole') {
                        value.forEach(i => brolelist.push(interaction.guild.roles.cache.get(i)))
                    }
                    if(key == 'join') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: You should have stayed for more than ${ms(value)} in this server\n`;
                    if(key == 'age') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Your Account should be older than ${ms(value)}\n`;
                });
            
                if(rolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Any of the Required Role(s) - ${rolelist.join(', ')}\n`;
                if(brolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Blacklisted Role(s) - ${brolelist.join(', ')}\n`;

                let msg = interaction.guild.channels.cache.get(entry.chId).messages.cache.get(entry.msgid);
                if(!msg) return;

                if(!entry.entries || entry.entries?.length == 0){
                    await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${entry.prize}**
${emoji.blankspace}${emoji.replyc} Winners: 
${emoji.blankspace}${emoji.replyc} Host: <@${entry.host}> ${entry.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${entry.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: Giveaway Cancelled
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`).setFooter({text: 'Giveaway has been cancelled due to no participation'})]});
                    entry.status = false;
                    entry.save();
                    return;
                }

                // Drawing winner(s)
                let list = entry.entries;
                var winnerId = ``;
                let winners = [];
                let no = Number(entry.winCount) || 1;
                try{
                    for (let i = 0; i < no && list?.length != 0; i++){
                        let rid = list[Math.floor(Math.random() * list?.length)];
                        if(winnerId.length == 0) winnerId = winnerId + `<@${rid}>`;
                        else winnerId = winnerId + `, <@${rid}>`;

                        winners.push(rid);
                        entry.winners.push(rid);

                        let r = [];
                        list.forEach(x => {
                            if(x != rid) r.push(x)
                        });
                        list = r;
                    };
                } catch (error){};

                let role = interaction.guild.roles.cache.get(config.winrole);
                winners.forEach(async i => {
                    if (role) {
                        await interaction.guild.members.fetch(i).catch(e => null);
                        await interaction.guild.members.cache.get(i).roles.add(role, 'Giveaway Winner Role').catch(e => null);
                    }
                });

                await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setFooter({text:`Giveaway has been ended.`}).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${entry.prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerId.length != 0?winnerId:'\`Error came\` :skull:'}
${emoji.blankspace}${emoji.replyc} Host: <@${entry.host}> ${entry.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${entry.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: <t:${((Date.now())/1000).toFixed(0)}>  [<t:${((Date.now())/1000).toFixed(0)}:R>]
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`)]});

                entry.status = false;
                entry.save();

                msg.channel.send({content: `${config.emote} Congratulations, ${winnerId}! You won **${entry.prize}** ${config.emote}`, embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription(`[**Link to Giveaway**](${msg.url})`)]}).catch(e => null);
            }, time)
        }
    }
};