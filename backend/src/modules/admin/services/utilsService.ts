import { prisma } from '../../../config/db.js';

export const getRolesFromDB = async () => {
    const roles = await prisma.role.findMany({
        select: {
            id: true,
            name: true
        }
    });
    return roles;
}

export const getclientFromDB = async () => {
    const client = await prisma.client.findMany({
        select: {
            id: true,
            name: true
        },
        where: {
            status:true
        }
    });
    return client;
}