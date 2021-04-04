import { Guild } from 'discord.js'

const guildDeletes = new Map<string, Map<string, number>>()

async function blockTerrorIfTerrorOccurred (guild: Guild): Promise<void> {
  const logs = await guild.fetchAuditLogs({ limit: 1 })
  let deletes: Map<string, number>

  const log = Array.from(logs.entries.entries())[0][1]

  if (!guildDeletes.has(guild.id)) guildDeletes.set(guild.id, new Map<string, number>())
  deletes = guildDeletes.get(guild.id)!
  if (!deletes.has(log.executor.id)) deletes.set(log.executor.id, 0)

  deletes.set(log.executor.id, deletes.get(log.executor.id)! + 1)

  if (deletes.get(log.executor.id)! >= Math.floor(guild.channels.cache.size / 2 + guild.roles.cache.size)) {
    const member = guild.member(log.executor.id)!

    if (!member.bannable) {
      guild.owner?.send(`${member.user.tag} terror detected, but failed to ban`)
      return
    }

    guild.member(log.executor)?.ban({
      reason: '[ANTITERROR] TERROR DETECTED.'
    })
    guild.owner?.send(`${member.user.tag} banned`)
  }
 
  const MS_IN_A_MINUTE = 60000
  const timeout = setTimeout(() => {
    deletes.set(log.executor.id, 0)
    clearInterval(timeout)
  }, MS_IN_A_MINUTE * 2)
}

export default blockTerrorIfTerrorOccurred
