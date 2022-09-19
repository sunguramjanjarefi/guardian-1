import { Request, Response, Router } from 'express';
import { permissionHelper, authorizationHelper } from '@auth/authorization-helper';
import { Users } from '@helpers/users';
import { AuthenticatedRequest, Logger } from '@guardian/common';
import { Guardians } from '@helpers/guardians';
import { UserRole } from '@guardian/interfaces';

/**
 * User account route
 */
export const accountAPI = Router();

accountAPI.get('/session', async (req: Request, res: Response) => {
    const users = new Users();
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            res.status(200).json(await users.getUserByToken(token));
        } else {
            res.sendStatus(401);
        }
    } catch (error) {
        new Logger().error(error, ['API_GATEWAY']);
        res.status(500).send({ code: 500, message: error.message });
    }
});

accountAPI.post('/register', async (req: Request, res: Response) => {
    const users = new Users();
    try {
        const { username, password } = req.body;
        let { role } = req.body;
        // @deprecated 2022-10-01
        if (role === 'ROOT_AUTHORITY') {
            role = UserRole.STANDARD_REGISTRY;
        }
        res.status(201).json(await users.registerNewUser(username, password, role));
    } catch (error) {
        new Logger().error(error, ['API_GATEWAY']);
        res.status(500).send({ code: 500, message: 'Server error' });
    }
});

accountAPI.post('/login', async (req: Request, res: Response) => {
    const users = new Users();
    try {
        const { username, password } = req.body;
        res.status(200).json(await users.generateNewToken(username, password));
    } catch (error) {
        new Logger().error(error, ['API_GATEWAY']);
        res.status(error.code).send({ code: error.code, message: error.message });
    }
});

accountAPI.get('/', authorizationHelper, permissionHelper(UserRole.STANDARD_REGISTRY),async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = new Users();
        res.status(200).json(await users.getAllUserAccounts());
    } catch (error) {
        new Logger().error(error, ['API_GATEWAY']);
        res.status(500).send({ code: 500, message: 'Server error' });
    }
});

/**
 * @deprecated 2022-10-01
 */
accountAPI.get('/root-authorities', authorizationHelper, async (req: Request, res: Response) => {
    try {
        const users = new Users();
        const standardRegistries = await users.getAllStandardRegistryAccounts();
        res.json(standardRegistries);
    } catch (error) {
        new Logger().error(error.message, ['API_GATEWAY']);
        res.json('null');
    }
});

accountAPI.get('/standard-registries', authorizationHelper, async (req: Request, res: Response) => {
    try {
        const users = new Users();
        const standardRegistries = await users.getAllStandardRegistryAccounts();
        res.json(standardRegistries);
    } catch (error) {
        new Logger().error(error.message, ['API_GATEWAY']);
        res.json('null');
    }
});

accountAPI.get('/balance', async (req: Request, res: Response) => {
    try {
        console.log('+++++++  User balance');
        
        const authHeader = req.headers.authorization;
        console.log('++ 1');
        const users = new Users();
        if (authHeader) {
            console.log('++ 2');
            const token = authHeader.split(' ')[1];
            console.log('++ 3');
            try {
                console.log('++ 4');
                const user = await users.getUserByToken(token) as any;
                console.log('++ 5');
                if (user) {
                    console.log('++ 6');
                    const guardians = new Guardians();
                    console.log('++ 7');
                    const balance = await guardians.getBalance(user.username);
                    console.log('++ 8');
                    res.json(balance);
                    return;
                } else {
                    console.log('++ 9');
                    res.json('null');
                    return;
                }
            } catch (error) {
                console.log('++ 10');
                res.json('null');
                return;
            }
        }
        console.log('++ 11');
        res.json('null');
    } catch (error) {
        new Logger().error(error, ['API_GATEWAY']);
        console.log('++ 12');
        res.json('null');
    }
});