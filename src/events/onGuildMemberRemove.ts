import {
  GuildMember,
  PartialGuildMember,
  User
} from 'discord.js'
import blockTerrorIfTerrorOccurred from './function/blockTerrorIfTerrorOccurred'

async function onGuildMemberRemove (member: GuildMember | PartialGuildMember): Promise<void> {
  const fetchedLogs = await member.guild.fetchAuditLogs({
    limit: 1,
    type: 'MEMBER_KICK'
  })

  const kickLog = fetchedLogs.entries.first()

  if (!kickLog) return

  const { target } = kickLog

  if ((target as User).id === member.id) {
    blockTerrorIfTerrorOccurred(member.guild)
  }
}

export default onGuildMemberRemove
