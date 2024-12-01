const chatRoute = require("./chat.route.js");
const userRoute = require("./user.route.js");

const userMiddleware = require("../../middlewares/client/user.middleware");

module.exports = (app) => {
    app.use(userMiddleware.infoUser);
    app.use('/chat', userMiddleware.requireAuth, chatRoute);
    app.use('/user', userRoute);
}