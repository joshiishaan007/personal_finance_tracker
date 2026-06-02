// Thrown only at the framework boundary (auth guard). Feature code uses Result
// for expected failures; catchRoute maps HttpError -> its status.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
