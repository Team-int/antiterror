import { CategoryChannel, Guild, GuildAuditLogsEntry, GuildChannel, Role, TextChannel, VoiceChannel } from 'discord.js'

const guildDeletes = new Map<string, Map<string, number>>()
const restorables = new Map<string, Array<GuildChannel | Role>>()

async function blockTerrorIfTerrorOccurred (guild: Guild, extra?: GuildChannel | Role): Promise<void> {
  const logs = await guild.fetchAuditLogs({ limit: 1 })

  const log = Array.from(logs.entries.entries())[0][1]

  if (!guildDeletes.has(guild.id)) guildDeletes.set(guild.id, new Map<string, number>())
  const deletes = guildDeletes.get(guild.id)!
  if (!deletes.has(log.executor.id)) deletes.set(log.executor.id, 0)

  deletes.set(log.executor.id, deletes.get(log.executor.id)! + 1)
  if (extra) {
    if (!restorables.get(log.executor.id)) {
      restorables.set(log.executor.id, [])
    }
    restorables.get(log.executor.id)?.push(extra)
  }

  if (deletes.get(log.executor.id)! >= 5) {
    const member = guild.member(log.executor.id)!

    if (!member.bannable) {
      guild.owner?.send(`${member.user.tag} terror detected, but failed to ban`)
    } else {
      guild.member(log.executor)?.ban({
        reason: '[ANTITERROR] TERROR DETECTED.'
      })

      guild.owner?.send(`${member.user.tag} banned`)
    }

    restorables.get(log.executor.id)?.forEach((restorable) => {
      restore(log, restorable)
    })
    restorables.set(log.executor.id, []) // reset restorables
    deletes.set(log.executor.id, 0)
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

    if (channel.type === 'text' || channel.type === 'voice') {
      restoreChannelDelete(guild, channel)
    }
  }

  if (log.action === 'ROLE_DELETE') {
    const role = extra as Role

    restoreRoleDelete(guild, role)
  }
}

async function restoreChannelDelete (guild: Guild, channel: GuildChannel) {
  let parent: CategoryChannel | undefined

  if (channel.parent) {
    const parentChannel = guild.channels.cache.get(channel.parent.id)

    if (parentChannel) {
      parent = parentChannel as CategoryChannel
    }
  }

  if (channel.type === 'text') {
    const textChannel = channel as TextChannel

    guild.channels.create(textChannel.name, {
      permissionOverwrites: textChannel.permissionOverwrites,
      topic: textChannel.topic ? textChannel.topic : undefined,
      type: textChannel.type,
      nsfw: textChannel.nsfw,
      parent,
      rateLimitPerUser: textChannel.rateLimitPerUser,
      position: textChannel.rawPosition
    })
  }

  if (channel.type === 'voice') {
    const voiceChannel = channel as VoiceChannel

    guild.channels.create(voiceChannel.name, {
      permissionOverwrites: voiceChannel.permissionOverwrites,
      type: voiceChannel.type,
      parent,
      bitrate: voiceChannel.bitrate,
      userLimit: voiceChannel.userLimit,
      position: voiceChannel.position
    })
  }
}

async function restoreRoleDelete (guild: Guild, role: Role) {
  guild.roles.create({
    data: {
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      position: role.position,
      permissions: role.permissions,
      mentionable: role.mentionable
    }
  })
}

export default blockTerrorIfTerrorOccurred
