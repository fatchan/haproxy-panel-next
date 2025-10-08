import { Capabilities } from '../capabilities.js';

export function hasCapability(requiredCapability) {
  return (req, res, next) => {
    try {
      const user = res.locals.originalUser;
      if (!user || !user.billing || !Array.isArray(user.billing.capabilities)) {
        return dynamicResponse(req, res, 400, { error: 'No permission' });
      }
      if (!user.billing.capabilities.includes(requiredCapability)) {
        return dynamicResponse(req, res, 400, { error: 'No permission' });
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

