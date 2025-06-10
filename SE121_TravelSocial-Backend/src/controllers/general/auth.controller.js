const User = require('../../models/general/user.model')
const authServices = require('../../services/general/auth.service')
const cookie = require('cookies');
const jwt = require('jsonwebtoken');
const cloudinary =  require("../../config/cloudinary.config") 

module.exports.signup_get = (req, res) => { //Render home screen
    res.render('new user')
}

const maxAge = 60 * 60;

const createToken = (id) => {
    return jwt.sign({id}, 'travel', {
        expiresIn: maxAge   
    })
}

module.exports.signup_post = async (req, res, next) => { //Create new user accouut 
    const {userEmail, userPassword} = req.body
    const user = new User({
        userEmail,
        userPassword,
    })
    try {
        const savedUser = authServices.createUser(user)
        const token = createToken(savedUser._id);
        res.cookie('jwt', token, {httpOnly: true ,maxAge: maxAge * 1000})
        res.status(200).json({
            isSucess: true,
            data: savedUser,
            error: null
         })
    }
    catch(error){
        next(error)
    }
}

module.exports.signin_get = (req, res) => { //Render home screen
    res.render('user sign in')
}


module.exports.signin_post =  async (req, res) => { //Check login 
    const {userEmail, userPassword} = req.body;
    try {
        const user = await User.login(userEmail, userPassword);
        const token = createToken(user._id);

        console.log("Access token::", token)
        res.cookie('jwt', token, {httpOnly: true ,maxAge: maxAge * 1000})
        //res.cookie('jwt', token, {httpOnly: true ,maxAge: maxAge * 1000,secure: false,sameSite: 'None'})
        res.status(200).json({
            isSucess: true,
            data: user,
            error: null
        })
    }
    catch (error) {
        res.status(500).json({
            isSucess: false,
            data: null,
            error: error.message
        })
    }
}

module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', {maxAge: 1});
    res.redirect('/');

}

module.exports.getAllUser = async (req, res, next) => {
    try {
        const result = await authServices.getAllUser()
        res.status(201).json({
            isSuccess: true,
            data: result,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}
module.exports.getUserById = async (req, res, next) => {
    const userId = req.params.id
    try {
        const result = await authServices.getUserById(userId)
        res.status(201).json({
            isSuccess: true,
            data: result,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}
module.exports.getUserByUserRole = async (req, res, next) => {
    const userRole = 'location-owner'
    try {
        const result = await authServices.getByUserRole(userRole)
        res.status(201).json({
            isSuccess: true,
            data: result,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}
module.exports.updateUser = async (req, res, next) => {
    const userId = req.params.id
    const userData = req.body
    try {
        const result = await authServices.updateUser(userId, userData)
        res.status(201).json({
            isSuccess: true,
            data: result,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}
module.exports.deleteUser = async (req, res, next) => {
    const userId = req.params.id
    try {
        const result = await authServices.deleteUser(userId)
        res.status(201).json({
            isSuccess: true,
            data: result,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports.updateAvata = async (req, res) => {
    const userId = res.locals.user._id
    const userAvatar = req.body
    console.log("Update avt::" + userAvatar)

    const result = await authServices.updateAvata(userId, userAvatar)
    res.status(201).json({
        isSuccess: true,
        data: result,
        error: null
    })
    
}

module.exports.searchUsers = async (req, res, next) => {
    try {
        const { searchTerm } = req.query;
        const userId = res.locals.user._id;
        
        if (!searchTerm || searchTerm.trim() === '') {
            return res.json({
                isSuccess: true,
                data: [],
                error: null
            });
        }
        
        const results = await authServices.searchUsers(userId, searchTerm);
        
        res.json({
            isSuccess: true,
            data: results,
            error: null
        });
    } catch (error) {
        next(error);
    }
};
