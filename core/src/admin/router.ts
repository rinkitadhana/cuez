import {
  Router,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express"

const METHODS = ["get", "post", "put", "patch", "delete"] as const

const forwardRejections =
  (handler: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }

/**
 * Express 4 doesn't catch rejected promises from async handlers, so one failed
 * DB call would crash the process. Routers made here forward rejections to the
 * admin error handler (500) instead.
 */
export const adminRouter = (): Router => {
  const router = Router()
  for (const method of METHODS) {
    const original = router[method].bind(router) as (
      path: string,
      ...handlers: RequestHandler[]
    ) => Router
    ;(router as unknown as Record<string, unknown>)[method] = (
      path: string,
      ...handlers: RequestHandler[]
    ) => original(path, ...handlers.map(forwardRejections))
  }
  return router
}
