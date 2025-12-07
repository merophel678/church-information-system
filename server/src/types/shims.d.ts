declare module 'express' {
  const e: any;
  export default e;
  export type Request = any;
  export type Response = any;
  export type NextFunction = any;
  export type RequestHandler = any;
}

declare module 'cors' {
  const c: any;
  export default c;
}

declare module 'jsonwebtoken' {
  const j: any;
  export default j;
  export const sign: any;
  export const verify: any;
}

declare module 'bcrypt' {
  const b: any;
  export default b;
  export const hash: any;
  export const compare: any;
}

declare module 'multer' {
  const m: any;
  export default m;
}

declare var process: any;
declare var Buffer: any;
