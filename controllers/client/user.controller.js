const User = require("../../models/user.model")
const RoomChat = require("../../models/rooms-chat.model")
const md5 = require('md5')
const generate = require('../../helpers/generate.helpers')
const userScoket = require('../../sockets/client/user.socket');

module.exports.register = (req, res) => {
    res.render("client/pages/user/register", {
        pageTitle: "Trang đăng ký"
    })
}

module.exports.registerPost = async (req, res) => {
    const user = req.body;

    const existUser = await User.findOne({
        email: user.email,
        deleted: false
    })

    if (existUser) {
        req.flash("error", "Email đã tồn tại trong hệ thống");
        res.redirect("back");
        return;
    }

    const dataUser = {
        fullName: user.fullName,
        email: user.email,
        password: md5(user.password),
        token: generate.generateRandomString(30),
        status: "active"
    }

    const newUser = new User(dataUser);
    await newUser.save();

    res.cookie("tokenUser", newUser.token);
    req.flash("success", "Đăng ký tài khoản thành công");
    res.redirect("/chat");
}

module.exports.login = (req, res) => {
    res.render("client/pages/user/login", {
        pageTitle: "Trang đăng nhập"
    })
}

module.exports.loginPost = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const existUser = await User.findOne({
        email: email,
        deleted: false,
    })

    if (!existUser) {
        req.flash("error", "Email không tồn tại trong hệ thống");
        res.redirect("back");
        return;
    }

    if (existUser.password != md5(password)) {
        req.flash("error", "Sai mật khẩu");
        res.redirect("back");
        return;
    }

    if (existUser.status != "active") {
        req.flash("error", "Tài khoản đang bị khóa");
        res.redirect("back");
        return;
    }

    res.cookie("tokenUser", existUser.token);

    await User.updateOne({
        email: email
    }, {
        statusOnline: "online"
    });

    _io.once("connection", (socket) => {
        _io.emit("SERVER_RETURN_STATUS_ONLINE_USER", {
            userId: existUser.id,
            statusOnline: "online"
        })
    })
    
    req.flash("success", "Đăng nhập thành công");
    res.redirect("/chat");
}

module.exports.logout = async (req, res) => {
    await User.updateOne({
        token: req.cookies.tokenUser
    }, {
        statusOnline: "offline"
    });

    _io.once("connection", (socket) => {
        _io.emit("SERVER_RETURN_STATUS_ONLINE_USER", {
            userId: res.locals.user.id,
            statusOnline: "offline"
        })
    })

    res.clearCookie("tokenUser");

    req.flash("success", "Đã đăng xuất!");
    res.redirect("/chat");
}

module.exports.notFriend = async (req, res) => {
    userScoket(req, res);
    const userIdA = res.locals.user.id;
    const friendList = res.locals.user.friendList;
    const friendListId = friendList.map(item => item.userId);

    const users = await User.find({
        $and: [
            { _id: { $ne: userIdA } }, // $ne: not equal
            { _id: { $nin: res.locals.user.requestFriends } }, // $nin: not in
            { _id: { $nin: res.locals.user.acceptFriends } }, // $nin: not in
            { _id: { $nin: friendListId } } // $nin: not in
        ],
        deleted: false,
        status: "active"
    }).select("id fullName avatar");

    res.render('client/pages/user/not-friend', {
        pageTitle: "Danh sách người dùng",
        users: users
    })
}

module.exports.request = async (req, res) => {
    userScoket(req, res);
    const users = await User.find({
        _id: { $in: res.locals.user.requestFriends },
        deleted: false,
        status: "active"
    }).select("id fullName avatar");

    res.render('client/pages/user/request', {
        pageTitle: "Lời mời đã gửi",
        users: users
    })
}

module.exports.accept = async (req, res) => {
    userScoket(req, res);
    const users = await User.find({
        _id: { $in: res.locals.user.acceptFriends },
        deleted: false,
        status: "active"
    }).select("id fullName avatar");

    res.render('client/pages/user/accept', {
        pageTitle: "Lời mời đã nhận",
        users: users
    })
}

module.exports.friends = async (req, res) => {
    userScoket(req, res);
    const friendList = res.locals.user.friendList;
    const users = [];

    for(const user of friendList){
        const infoUser = await User.findOne({
            _id: user.userId,
            deleted: false,
            status: "active"
        });

        users.push({
            id: infoUser.id,
            fullName: infoUser.fullName,
            avatar: infoUser.avatar,
            statusOnline: infoUser.statusOnline,
            roomChatId: user.roomChatId
        });
    }
    
    res.render('client/pages/user/friends', {
        pageTitle: "Danh sách bạn bè",
        users: users
    })
}

module.exports.rooms = async (req, res) => {
    const listRoomChat = await RoomChat.find({
        "users.userId": res.locals.user.id,
        typeRoom: "group",
        deleted: false
    })
    
    res.render('client/pages/user/rooms', {
        pageTitle: "Phòng chat",
        listRoomChat: listRoomChat
    })
}

module.exports.createRoom = async (req, res) => {
    const friendList = res.locals.user.friendList;
    console.log(friendList);

    const friendListFinal = [];

    for(const friend of friendList){
        const infoFriend = await User.findOne({
            _id: friend.userId,
            deleted: false
        });

        if(infoFriend){
            friendListFinal.push({
                userId: friend.userId,
                fullName: infoFriend.fullName
            });
        }
    }

    res.render('client/pages/user/create-room', {
        pageTitle: "Tạo phòng chat",
        friendsList: friendListFinal
    })
}

module.exports.createRoomPost = async (req, res) => {
    const title = req.body.title;
    const usersId = req.body.usersId;

    const dataRoom = {
        title: title,
        typeRoom: "group",
        users: [],
    };

    dataRoom.users.push({
        userId: res.locals.user.id,
        role: "superAdmin"
    });

    for(const userId of usersId){
        dataRoom.users.push({
            userId: userId,
            role: "user"
        });
    }

    const room = new RoomChat(dataRoom);
    await room.save();

    res.redirect(`/chat/${room.id}`);
}
