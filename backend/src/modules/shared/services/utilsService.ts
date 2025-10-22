// Adaptador para mantener la firma usada por utilsController existente
import { fetchRolesMinimal } from './role.service.js'
import { listActiveClients } from './client.service.js'

export const getRolesFromDB = async () => {
  return fetchRolesMinimal()
}

export const getclientFromDB = async () => {
  return listActiveClients(true)
}

