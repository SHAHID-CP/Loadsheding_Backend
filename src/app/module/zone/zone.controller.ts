import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/sendResponse';
import {type CreateZoneInput,type ListZoneQuery,type UpdateZoneInput,ZoneService,} from './zone.service';

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await ZoneService.create(req.user?.id as string, req.body as CreateZoneInput);
  sendSuccess(res,StatusCodes.CREATED ,'Zone created successfully', data );
});

const list = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ZoneService.list(req.query as ListZoneQuery);
  sendSuccess(res,StatusCodes.OK ,'Zones fetched successfully', {meta, data} );
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await ZoneService.getById(req.params.id as string);
  sendSuccess(res, StatusCodes.OK,'Zone fetched successfully', data );
});

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await ZoneService.update(
    req.user?.id as string,
    req.params.id as string,
    req.body as UpdateZoneInput,
  );
  sendSuccess(res,StatusCodes.OK,'Zone updated successfully', data );
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const data = await ZoneService.softDelete(req.user?.id as string, req.params.id as string);
  sendSuccess(res, StatusCodes.OK,'Zone deleted successfully', data );
});

export const ZoneController = { create, list, getById, update, softDelete };
