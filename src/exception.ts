export class HttpException extends Error {
    status: number
    code?: string
    meta?: Record<string, any>

    constructor(message: string, status: number = 500, code?: string, meta?: Record<string, any>) {
        super(message)
        this.name = 'HttpException'
        this.status = status
        this.code = code
        this.meta = meta
    }

    toResponse(): Response {
        return new Response(
            JSON.stringify({
                error: this.message,
                code: this.code,
                ...(this.meta ? { meta: this.meta } : {}),
            }),
            {
                status: this.status,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}

export class BadRequestException extends HttpException {
    constructor(message = 'Bad Request', meta?: Record<string, any>) {
        super(message, 400, 'BAD_REQUEST', meta)
    }
}

export class UnauthorizedException extends HttpException {
    constructor(message = 'Unauthorized', meta?: Record<string, any>) {
        super(message, 401, 'UNAUTHORIZED', meta)
    }
}

export class ForbiddenException extends HttpException {
    constructor(message = 'Forbidden', meta?: Record<string, any>) {
        super(message, 403, 'FORBIDDEN', meta)
    }
}

export class NotFoundException extends HttpException {
    constructor(message = 'Not Found', meta?: Record<string, any>) {
        super(message, 404, 'NOT_FOUND', meta)
    }
}

export class MethodNotAllowedException extends HttpException {
    constructor(message = 'Method Not Allowed', meta?: Record<string, any>) {
        super(message, 405, 'METHOD_NOT_ALLOWED', meta)
    }
}

export class NotAcceptableException extends HttpException {
    constructor(message = 'Not Acceptable', meta?: Record<string, any>) {
        super(message, 406, 'NOT_ACCEPTABLE', meta)
    }
}

export class RequestTimeoutException extends HttpException {
    constructor(message = 'Request Timeout', meta?: Record<string, any>) {
        super(message, 408, 'REQUEST_TIMEOUT', meta)
    }
}

export class ConflictException extends HttpException {
    constructor(message = 'Conflict', meta?: Record<string, any>) {
        super(message, 409, 'CONFLICT', meta)
    }
}

export class GoneException extends HttpException {
    constructor(message = 'Gone', meta?: Record<string, any>) {
        super(message, 410, 'GONE', meta)
    }
}

export class PreconditionFailedException extends HttpException {
    constructor(message = 'Precondition Failed', meta?: Record<string, any>) {
        super(message, 412, 'PRECONDITION_FAILED', meta)
    }
}

export class PayloadTooLargeException extends HttpException {
    constructor(message = 'Payload Too Large', meta?: Record<string, any>) {
        super(message, 413, 'PAYLOAD_TOO_LARGE', meta)
    }
}

export class UriTooLongException extends HttpException {
    constructor(message = 'URI Too Long', meta?: Record<string, any>) {
        super(message, 414, 'URI_TOO_LONG', meta)
    }
}

export class UnsupportedMediaTypeException extends HttpException {
    constructor(message = 'Unsupported Media Type', meta?: Record<string, any>) {
        super(message, 415, 'UNSUPPORTED_MEDIA_TYPE', meta)
    }
}

export class RangeNotSatisfiableException extends HttpException {
    constructor(message = 'Range Not Satisfiable', meta?: Record<string, any>) {
        super(message, 416, 'RANGE_NOT_SATISFIABLE', meta)
    }
}

export class ExpectationFailedException extends HttpException {
    constructor(message = 'Expectation Failed', meta?: Record<string, any>) {
        super(message, 417, 'EXPECTATION_FAILED', meta)
    }
}

export class TooManyRequestsException extends HttpException {
    constructor(message = 'Too Many Requests', meta?: Record<string, any>) {
        super(message, 429, 'TOO_MANY_REQUESTS', meta)
    }
}

export class InternalServerException extends HttpException {
    constructor(message = 'Internal Server Error', meta?: Record<string, any>) {
        super(message, 500, 'INTERNAL_SERVER_ERROR', meta)
    }
}

export class ServiceUnavailableException extends HttpException {
    constructor(message = 'Service Unavailable', meta?: Record<string, any>) {
        super(message, 503, 'SERVICE_UNAVAILABLE', meta)
    }
}

export class GatewayTimeoutException extends HttpException {
    constructor(message = 'Gateway Timeout', meta?: Record<string, any>) {
        super(message, 504, 'GATEWAY_TIMEOUT', meta)
    }
}
