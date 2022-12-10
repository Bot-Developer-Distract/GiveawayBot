const gawModel = require(`../../Models/giveawaySchema`);
const {EmbedBuilder} = require('discord.js')
const emoji = require(`../../config/emoji.json`);
const config = require('../../config/giveaway.json');
const ms = require('ms');
const client = require('../../index');

module.exports = {
    name: 'keepGawAliveAfterRestart'
};

client.on('ready', async client => {await gaw(client)});

async function gaw(client){
    let l = await gawModel.find({status: true});

    l.forEach(async i => {
        if(Date.now() - Number(i.endtime) > 0 || Date.now() - Number(i.endtime) == 0){
            let guild = client.guilds.cache.get(i.serverID);
            if(!guild  || !guild.available) await client.guilds.fetch(i.serverID).catch(e => null);
            guild = client.guilds.cache.get(i.serverID);
            if(!guild || !guild.available) return;

            let id = i.msgid;
            if(!id) return;

            if(!i.status) return;

            await guild.channels.cache.get(i.chId).messages.fetch(i.msgid).catch(e => null);

            const {multi, req} = i;
            let desc = '';
            let desc2 = '';
            let rolelist = [];
            let brolelist = [];

            multi.forEach(function(value, key){
                desc = desc + `${emoji.blankspace} :white_medium_small_square: ${guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
            });

            req.forEach(function(value, key){
                if(key == 'role') {
                    value.forEach(i => rolelist.push(guild.roles.cache.get(i)))
                }
                if(key == 'blackrole') {
                    value.forEach(i => brolelist.push(guild.roles.cache.get(i)))
                }
                if(key == 'join') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: You should have stayed for more than ${ms(value)} in this server\n`;
                if(key == 'age') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Your Account should be older than ${ms(value)}\n`;
            });
        
            if(rolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Any of the Required Role(s) - ${rolelist.join(', ')}\n`;
            if(brolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Blacklited Role(s) - ${brolelist.join(', ')}\n`;

            let msg = guild.channels.cache.get(i.chId).messages.cache.get(i.msgid);
            if(!msg) return;

            if(!i.entries || i.entries?.length == 0){
                await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${i.prize}**
${emoji.blankspace}${emoji.replyc} Winners: 
${emoji.blankspace}${emoji.replyc} Host: <@${i.host}> ${i.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${i.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: Giveaway Cancelled
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`).setFooter({text: 'Giveaway has been cancelled due to no participation'})]});  

i.status = false;
i.save();         
                return;
            }

            // Drawing winner(s)
            let list = i.entries;
            var winnerId = ``;
            let winners = [];
            let no = Number(i.winCount) || 1;
            try{
                for (let i = 0; i < no && list?.length != 0; i++){
                    let rid = list[Math.floor(Math.random() * list?.length)];
                    if(winnerId.length == 0) winnerId = winnerId + `<@${rid}>`;
                    else winnerId = winnerId + `, <@${rid}>`;

                    winners.push(rid);
                    i.winners.push(rid);

                    let r = [];
                    list.forEach(x => {
                        if(x != rid) r.push(x)
                    });
                    list = r;
                };
            } catch (error){};

            let role = guild.roles.cache.get(config.winrole);
            winners.forEach(async i => {
                if (role) {
                    await guild.members.fetch(i).catch(e => null);
                    await guild.members.cache.get(i).roles.add(role, 'Giveaway Winner Role').catch(e => null);
                }
            });

            await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setFooter({text:`Giveaway has been ended.`}).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${i.prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerId.length != 0?winnerId:'\`Error came\` :skull:'}
${emoji.blankspace}${emoji.replyc} Host: <@${i.host}> ${i.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${i.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: <t:${((Date.now())/1000).toFixed(0)}>  [<t:${((Date.now())/1000).toFixed(0)}:R>]
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`)]});

            i.status = false;
            i.save();

            msg.channel.send({content: `${config.emote} Congratulations, ${winnerId}! You won **${i.prize}** ${config.emote}`, embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription(`[**Link to Giveaway**](${msg.url})`)]}).catch(e => null);

        } else {
            let time = Number(i.endtime) - Date.now();
            setTimeout(async () => {
                let guild = client.guilds.cache.get(i.serverID);
                if(!guild  || !guild.available) await client.guilds.fetch(i.serverID).catch(e => null);
                guild = client.guilds.cache.get(i.serverID);
                if(!guild || !guild.available) return;

                let id = i.msgid;
                if(!id) return;
    
                if(!i.status) return;
    
                await guild.channels.cache.get(i.chId).messages.fetch(i.msgid).catch(e => null);
    
                const {multi, req} = i;
                let desc = '';
                let desc2 = '';
                let rolelist = [];
                let brolelist = [];
    
                multi.forEach(function(value, key){
                    desc = desc + `${emoji.blankspace} :white_medium_small_square: ${guild.roles.cache.get(key) || '@deletedRole'} - \`x${value}\` Entries.\n`;
                });
    
                req.forEach(function(value, key){
                    if(key == 'role') {
                        value.forEach(i => rolelist.push(guild.roles.cache.get(i)))
                    }
                    if(key == 'blackrole') {
                        value.forEach(i => brolelist.push(guild.roles.cache.get(i)))
                    }
                    if(key == 'join') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: You should have stayed for more than ${ms(value)} in this server\n`;
                    if(key == 'age') desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Your Account should be older than ${ms(value)}\n`;
                });
            
                if(rolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Any of the Required Role(s) - ${rolelist.join(', ')}\n`;
                if(brolelist.length > 0) desc2 = desc2 + `${emoji.blankspace} :white_medium_small_square: Blacklited Role(s) - ${brolelist.join(', ')}\n`;
    
                let msg = guild.channels.cache.get(i.chId).messages.cache.get(i.msgid);
                if(!msg) return;

                if(!i.entries || i.entries?.length == 0){
                    await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${i.prize}**
${emoji.blankspace}${emoji.replyc} Winners: 
${emoji.blankspace}${emoji.replyc} Host: <@${i.host}> ${i.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${i.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: Giveaway Cancelled
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`).setFooter({text: 'Giveaway has been cancelled due to no participation'})]});  

i.status = false;
i.save();         
                    return;
                }
    
                // Drawing winner(s)
                let list = i.entries;
                var winnerId = ``;
                let winners = [];
                let no = Number(i.winCount) || 1;
                try{
                    for (let i = 0; i < no && list?.length != 0; i++){
                        let rid = list[Math.floor(Math.random() * list?.length)];
                        if(winnerId.length == 0) winnerId = winnerId + `<@${rid}>`;
                        else winnerId = winnerId + `, <@${rid}>`;

                        winners.push(rid);
                        i.winners.push(rid);
    
                        let r = [];
                        list.forEach(x => {
                            if(x != rid) r.push(x)
                        });
                        list = r;
                    };
                } catch (error){};

                let role = guild.roles.cache.get(config.winrole);
                winners.forEach(async i => {
                    if (role) {
                        await guild.members.fetch(i).catch(e => null);
                        await guild.members.cache.get(i).roles.add(role, 'Giveaway Winner Role').catch(e => null);
                    }
                });
    
                await msg.edit({components: [], embeds: [new EmbedBuilder(msg.embeds[0].data).setFooter({text:`Giveaway has been ended.`}).setDescription(`
${emoji.point} **Giveaway Details**
${emoji.blankspace}${emoji.replyc} Prize: **${i.prize}**
${emoji.blankspace}${emoji.replyc} Winners: ${winnerId.length != 0?winnerId:'\`Error came\` :skull:'}
${emoji.blankspace}${emoji.replyc} Host: <@${i.host}> ${i.entrylimit != 'infinite'?`\n${emoji.blankspace}${emoji.replyc} Entry stopped at ${i.entrylimit} Entries`:``}
${emoji.blankspace}${emoji.reply} Ends: <t:${((Date.now())/1000).toFixed(0)}>  [<t:${((Date.now())/1000).toFixed(0)}:R>]
${desc.length == 0?``:`\n${emoji.point} **Multiplier**\n`.concat(desc)}
${desc2.length == 0?``:`${emoji.point} **Requirements**\n`.concat(desc2)}
`)]});
    
                i.status = false;
                i.save();
    
                msg.channel.send({content: `${config.emote} Congratulations, ${winnerId}! You won **${i.prize}** ${config.emote}`, embeds: [new EmbedBuilder().setColor('#ff4c0a').setDescription(`[**Link to Giveaway**](${msg.url})`)]}).catch(e => null);
            }, time)
        }
    })
}