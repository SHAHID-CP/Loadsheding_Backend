import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/sendResponse';
import {type CreateSubstationInput,type ListSubstationQuery,SubstationService,type UpdateSubstationInput,} from './substation.service';

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await SubstationService.create(
    req.user?.id as string,
    req.body as CreateSubstationInput,
  );
  sendSuccess(res, StatusCodes.CREATED,'Substation created successfully', data);
});

const list = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await SubstationService.list(req.query as ListSubstationQuery);
  sendSuccess(res, StatusCodes.OK, 'Substations fetched successfully',{ meta, data });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await SubstationService.getById(req.params.id as string);
  sendSuccess(res,StatusCodes.OK,'Substation fetched successfully', data );
});

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await SubstationService.update(
    req.user?.id as string,
    req.params.id as string,
    req.body as UpdateSubstationInput,
  );
  sendSuccess(res, StatusCodes.OK, 'Substation updated successfully', data );
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const data = await SubstationService.softDelete(
    req.user?.id as string,
    req.params.id as string,
  );
  sendSuccess(res, StatusCodes.OK,'Substation deleted successfully', data );
});

export const SubstationController = { create, list, getById, update, softDelete };
