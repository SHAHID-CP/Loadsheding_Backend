import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/sendResponse.js';
import {AreaService,type CreateAreaInput,type ListAreaQuery,type UpdateAreaInput,} from './area.service.js';

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await AreaService.create(req.user?.id as string, req.body as CreateAreaInput);
  sendSuccess(res, StatusCodes.CREATED, 'Area created successfully', data );
});

const list = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await AreaService.list(req.query as ListAreaQuery);
  sendSuccess(res, StatusCodes.OK,'Areas fetched successfully', {meta, data });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await AreaService.getById(req.params.id as string);
  sendSuccess(res, StatusCodes.OK,'Area fetched successfully', data );
});

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await AreaService.update(
    req.user?.id as string,
    req.params.id as string,
    req.body as UpdateAreaInput,
  );
  sendSuccess(res, StatusCodes.OK,'Area updated successfully', data );
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const data = await AreaService.softDelete(req.user?.id as string, req.params.id as string);
  sendSuccess(res, StatusCodes.OK, 'Area deleted successfully', data );
});

export const AreaController = { create, list, getById, update, softDelete };
