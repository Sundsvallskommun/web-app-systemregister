export class HttpException extends Error {
  public status: number;
  public message: string;
  public details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.message = message;
    this.details = details;
  }
}
