import { Request, Response } from "express";
import * as utilsService from '../services/utilsService.js'

export const getRoles = async (req: Request, res: Response) => {

    const roles = await utilsService.getRolesFromDB()
    res.status(200).json(roles);
}

export const getclient = async (req: Request, res: Response) => {

    const client = await utilsService.getclientFromDB()
    res.status(200).json(client);
}
