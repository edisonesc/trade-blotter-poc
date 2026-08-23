import {
  ArgumentsHost,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let res: { status: jest.Mock; json: jest.Mock };
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    host = {
      switchToHttp: () => ({ getResponse: () => res }),
    } as unknown as ArgumentsHost;
  });

  it('preserves the real status and message for a thrown NotFoundException', () => {
    filter.catch(new NotFoundException('Record not found'), host);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Record not found',
    });
  });

  it('preserves the real status and message for a thrown ForbiddenException', () => {
    filter.catch(
      new ForbiddenException('Trade does not belong to current user'),
      host,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Trade does not belong to current user',
    });
  });

  it('masks the message with a generic string for a non-HttpException error', () => {
    filter.catch(new Error('unexpected database failure'), host);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
    });
  });
});
