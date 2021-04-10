import { CategoryChannel, Guild, GuildAuditLogsEntry, GuildChannel, NewsChannel, Role, TextChannel, VoiceChannel } from 'discord.js'

const guildDeletes = new Map<string, Map<string, number>>()
const restorables = new Map<string, Array<GuildChannel | Role>>()

async function blockTerrorIfTerrorOccurred (guild: Guild, extra?: GuildChannel | Role): Promise<void> {
  const logs = await guild.fetchAuditLogs({ limit: 1 })

  const log = Array.from(logs.entries.entries())[0][1]

  if (!guildDeletes.has(guild.id)) guildDeletes.set(guild.id, new Map<string, number>())
  const deletes = guildDeletes.get(guild.id)!
  if (!deletes.has(log.executor.id)) deletes.set(log.executor.id, 0)

  deletes.set(log.executor.id, deletes.get(log.executor.id)! + 1)
  if (extra) restorables.get(log.executor.id)?.push(extra)

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
    restorables.get(log.executor.id)?.forEach((restorable) => {
      restore(log, restorable)
    })
  }

  const MS_IN_A_MINUTE = 60000
  const timeout = setTimeout(() => {
    deletes.set(log.executor.id, 0)
    clearInterval(timeout)
  }, MS_IN_A_MINUTE * 2)
}

async function restore (log: GuildAuditLogsEntry, extra: GuildChannel | Role) {
  const { guild } = extra

  if (log.action === 'CHANNEL_DELETE') {
    const channel = extra as GuildChannel

    if (channel.type === 'category') {
      restoreChannelDelete(guild, channel)
    }
  }

  if (log.action === 'ROLE_DELETE') {
    const role = extra as Role

    restoreRoleDelete(guild, role)
  }
}

async function restoreChannelDelete (guild: Guild, channel: GuildChannel) {
  const category = channel as CategoryChannel

  const created = await guild.channels.create(category.name, {
    permissionOverwrites: category.permissionOverwrites,
    type: category.type,
    position: category.position
  })

  category.children.forEach((children) => {
    if (children.type === 'news' || channel.type === 'text') {
      const textBasedChannel = children as TextChannel | NewsChannel

      guild.channels.create(textBasedChannel.name, {
        permissionOverwrites: textBasedChannel.permissionOverwrites,
        topic: textBasedChannel.topic ? textBasedChannel.topic : undefined,
        type: textBasedChannel.type,
        nsfw: textBasedChannel.nsfw,
        parent: created,
        rateLimitPerUser: textBasedChannel instanceof TextChannel ? textBasedChannel.rateLimitPerUser : undefined,
        position: textBasedChannel.position
      })
    }

    if (children.type === 'voice') {
      const voiceChannel = children as VoiceChannel

      guild.channels.create(voiceChannel.name, {
        permissionOverwrites: voiceChannel.permissionOverwrites,
        type: voiceChannel.type,
        parent: created,
        bitrate: voiceChannel.bitrate,
        userLimit: voiceChannel.userLimit,
        position: voiceChannel.position
      })
    }
  })
}

async function restoreRoleDelete (guild: Guild, role: Role) {
  // ummmm comming soon
}

export default blockTerrorIfTerrorOccurred
