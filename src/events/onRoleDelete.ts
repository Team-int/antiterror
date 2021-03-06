import blockTerrorIfTerrorOccurred from './function/blockTerrorIfTerrorOccurred'

import { Role } from 'discord.js'

function onRoleDelete (role: Role): void {
  blockTerrorIfTerrorOccurred(role.guild, role)
}

export default onRoleDelete
