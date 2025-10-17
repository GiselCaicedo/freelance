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

export const getBusinessFromDB = async () => {
    const business = await prisma.business.findMany({
        select: {
            id: true,
            name: true
        },
        where: {
            status:true
        }
    });
    return business;
}
