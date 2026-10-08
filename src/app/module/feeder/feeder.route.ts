// import { Role } from '@prisma/client';
import { Router } from 'express';
import { Role } from '../../../../generated/prisma/enums';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { FeederController } from './feeder.controller';
import { FeederValidation } from './feeder.validation';

const router = Router();

router.post('/',auth(Role.ADMIN),validate(FeederValidation.createFeederSchema),FeederController.create,);

router.get('/', auth(), validate(FeederValidation.listFeederSchema), FeederController.list);

router.get('/:id',auth(Role.ADMIN,Role.CUSTOMER,Role.TECHNICIAN),validate(FeederValidation.feederIdSchema),FeederController.getById,);

router.patch('/:id',auth(Role.ADMIN),validate(FeederValidation.updateFeederSchema),FeederController.update,);

router.delete('/:id',auth(Role.ADMIN),validate(FeederValidation.feederIdSchema),FeederController.softDelete,);

export const FeederRoutes = router;
