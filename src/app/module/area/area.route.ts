// import { Role } from '@prisma/client';
import { Router } from 'express';
import { Role } from '../../../../generated/prisma/enums';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AreaController } from './area.controller';
import { AreaValidation } from './area.validation';

const router = Router();

router.post('/',auth(Role.ADMIN),validate(AreaValidation.createAreaSchema),AreaController.create,);

router.get('/', auth(), validate(AreaValidation.listAreaSchema), AreaController.list);

router.get('/:id', auth(), validate(AreaValidation.areaIdSchema), AreaController.getById);

router.patch('/:id',auth(Role.ADMIN),validate(AreaValidation.updateAreaSchema),AreaController.update,);

router.delete('/:id',auth(Role.ADMIN),validate(AreaValidation.areaIdSchema),AreaController.softDelete,);

export const AreaRoutes = router;
