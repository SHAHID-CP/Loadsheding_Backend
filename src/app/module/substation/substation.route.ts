// import { Role } from '@prisma/client';
import { Router } from 'express';
import { Role } from '../../../../generated/prisma/enums';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { SubstationController } from './substation.controller';
import { SubstationValidation } from './substation.validation';

const router = Router();

router.post('/',auth(Role.ADMIN),validate(SubstationValidation.createSubstationSchema),SubstationController.create,);

router.get('/',auth(Role.ADMIN,Role.CUSTOMER,Role.TECHNICIAN),validate(SubstationValidation.listSubstationSchema),SubstationController.list,);

router.get('/:id',auth(Role.ADMIN,Role.CUSTOMER,Role.TECHNICIAN),validate(SubstationValidation.substationIdSchema),SubstationController.getById,);

router.patch('/:id',auth(Role.ADMIN),validate(SubstationValidation.updateSubstationSchema),SubstationController.update,);

router.delete('/:id',auth(Role.ADMIN),validate(SubstationValidation.substationIdSchema),SubstationController.softDelete,);

export const SubstationRoutes = router;
