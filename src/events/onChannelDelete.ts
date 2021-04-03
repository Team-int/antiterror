import {
  Channel,
  GuildChannel
} from 'discord.js'
import blockTerrorIfTerrorOccurred from './function/blockTerrorIfTerrorOccurred'

function onChannelDelete (channel: Channel): void {
  const guildChannel = channel as GuildChannel

  blockTerrorIfTerrorOccurred(guildChannel.guild)
}

export default onChannelDelete
