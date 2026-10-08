import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/sendResponse';
import {type CreateFeederInput,FeederService,type ListFeederQuery,type UpdateFeederInput,} from './feeder.service';

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await FeederService.create(
    req.user?.id as string,
    req.body as CreateFeederInput,
  );
  sendSuccess(res, StatusCodes.CREATED,'Feeder created successfully', data );
});

const list = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await FeederService.list(req.query as ListFeederQuery);
  sendSuccess(res, StatusCodes.OK,'Feeders fetched successfully',{ meta, data });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await FeederService.getById(req.params.id as string);
  sendSuccess(res, StatusCodes.OK,'Feeder fetched successfully', data );
});

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await FeederService.update(
    req.user?.id as string,
    req.params.id as string,
    req.body as UpdateFeederInput,
  );
  sendSuccess(res, StatusCodes.OK, 'Feeder updated successfully', data );
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const data = await FeederService.softDelete(req.user?.id as string, req.params.id as string);
  sendSuccess(res, StatusCodes.OK,'Feeder deleted successfully', data );
});

export const FeederController = { create, list, getById, update, softDelete };
