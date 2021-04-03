import { Guild } from 'discord.js'
import blockTerrorIfTerrorOccurred from './function/blockTerrorIfTerrorOccurred'

function onGuildBanAdd (guild: Guild): void {
  blockTerrorIfTerrorOccurred(guild)
}

export default onGuildBanAdd
