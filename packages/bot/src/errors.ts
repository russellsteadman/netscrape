export class BadRequest extends Error implements Error {
  status = 400;
}

export class NotAuthorized extends Error implements Error {
  status = 401;
}

export class NotFound extends Error implements Error {
  status = 404;
}

export class Unprocessable extends Error implements Error {
  status = 422;
}

export class Internal extends Error implements Error {
  status = 500;
}

export class BadGateway extends Error implements Error {
  status = 502;
}
