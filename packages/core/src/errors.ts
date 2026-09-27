export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string = 'Validation Error') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ExtractionError extends Error {
  constructor(message: string = 'Extraction Error') {
    super(message);
    this.name = 'ExtractionError';
  }
}
