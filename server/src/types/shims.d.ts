declare module 'express' {
  export interface Request {
    [key: string]: any;
  }

  export interface Response {
    status: (code: number) => Response;
    json: (body: any) => Response;
    send: (body?: any) => Response;
  }

  export type NextFunction = (err?: any) => void;

  export interface RequestHandler {
    (req: Request, res: Response, next?: NextFunction): any;
  }

  export interface Router {
    use: (...handlers: RequestHandler[]) => Router;
    use: (path: string, ...handlers: RequestHandler[]) => Router;
    get: (path: string, ...handlers: RequestHandler[]) => Router;
    post: (path: string, ...handlers: RequestHandler[]) => Router;
    put: (path: string, ...handlers: RequestHandler[]) => Router;
    delete: (path: string, ...handlers: RequestHandler[]) => Router;
  }

  export function Router(): Router;
  const e: () => any;
  export default e;
}

declare module 'cors' {
  import { RequestHandler } from 'express';
  function cors(options?: any): RequestHandler;
  export default cors;
}

declare module 'jsonwebtoken' {
  export const sign: (...args: any[]) => string;
  export const verify: (...args: any[]) => any;
}

declare module 'bcrypt' {
  export const hash: (...args: any[]) => Promise<string>;
  export const compare: (...args: any[]) => Promise<boolean>;
}

declare module 'multer' {
  const multer: any;
  export default multer;
}

declare var process: any;
declare var Buffer: any;
