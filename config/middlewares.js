/**
 * Middleware declaration
 *
 * Middlewares are simple functions which run **before** your controllers.
 * You can apply one or more middlewares to a given controller, or protect
 * its actions individually.
 *
 * Any middleware file (e.g. `api/middlewares/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 *   'AuthController': {
 *      '*': ['applyToAll'],
 *      'getUserData': ['applyToConcreteAction']
 *    }
 */


module.exports = {
};
