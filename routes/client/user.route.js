const express = require('express')
const router = express.Router()
const userMiddleware = require("../../middlewares/client/user.middleware");

const controller = require("../../controllers/client/user.controller");

router.get('/register', controller.register);

router.post('/register', controller.registerPost);

router.get('/login', controller.login);

router.post('/login', controller.loginPost);

router.get('/logout', controller.logout);

router.get('/not-friend', userMiddleware.requireAuth, controller.notFriend);

router.get('/request', userMiddleware.requireAuth, controller.request);

router.get('/accept', userMiddleware.requireAuth, controller.accept);

router.get('/friends', userMiddleware.requireAuth, controller.friends);

router.get('/rooms', userMiddleware.requireAuth, controller.rooms);

router.get('/rooms/create', userMiddleware.requireAuth, controller.createRoom);

router.post('/rooms/create', userMiddleware.requireAuth, controller.createRoomPost);

module.exports = router;