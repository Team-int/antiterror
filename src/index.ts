import { Client, Intents } from 'discord.js'

import events from './events/'

const client = new Client({
  ws: {
    intents: [
      Intents.PRIVILEGED,
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS
    ]
  }
})

client.on('ready', () => {
  console.log(`user: ${client.user?.tag}`)
})

client.on('channelDelete', events.onChannelDelete)
client.on('roleDelete', events.onRoleDelete)
client.on('guildMemberRemove', events.onGuildMemberRemove)
client.on('guildBanAdd', events.onGuildBanAdd)

client.login(process.env.TOKEN)
