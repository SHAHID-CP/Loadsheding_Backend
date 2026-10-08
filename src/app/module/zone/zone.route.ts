
import { Router } from 'express';
import { ZoneValidation } from './zone.validation';
import { Role } from '../../../../generated/prisma/enums';
import { auth } from '../../middleware/auth';
import { ZoneController } from './zone.controller';
import { validate } from '../../middleware/validate';



const router = Router();

router.post('/',auth(Role.ADMIN),validate(ZoneValidation.createZoneSchema),ZoneController.create,);

router.get('/', auth(), validate(ZoneValidation.listZoneSchema), ZoneController.list);

router.get('/:id', auth(), validate(ZoneValidation.zoneIdSchema), ZoneController.getById);

router.patch('/:id',auth(Role.ADMIN),validate(ZoneValidation.updateZoneSchema),ZoneController.update,);

router.delete('/:id',auth(Role.ADMIN),validate(ZoneValidation.zoneIdSchema),ZoneController.softDelete,);

export const ZoneRoutes = router;
