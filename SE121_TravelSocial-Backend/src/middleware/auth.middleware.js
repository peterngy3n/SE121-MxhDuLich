const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // Phải giống với secret ở trên
const User = require('../models/general/user.model')

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;
    
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({
//       isSuccess: false,
//       error: 'No token provided or invalid format',
//     });
//   }

//   const token = authHeader.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({
//         isSuccess: false,
//         message: 'Token không hợp lệ hoặc không tồn tại.',
//         data: null
//     });
//   }

// // Giải mã token
//   jwt.verify(token, 'travel', async (err, decoded) => {
//     if (err) {
//         return res.status(403).json({
//             isSuccess: false,
//             message: 'Token không hợp lệ.',
//             data: null
//         });
//     }
//     let user = await User.findById(decoded.id);
//     res.locals.user = user;
//     next();
//   });
// }

const verifyConnectSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.query.token;
    console.log('Token::', token)
  
    if (!token || !token.startsWith('Bearer ')) {
      return next(new Error('No token'));
    }
  
    try {
      const decoded = jwt.verify(token.split(' ')[1], 'travel');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
});
}


const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if(token) {
        jwt.verify(token, 'travel', (err, decodeToken) => {
            if(err) {
                console.log(err.message);
                res.redirect('/login');
            }
            else {
                console.log(decodeToken);
                next();
            }
        })
    }
    else {
        res.redirect('/login');
    }               
};

// check current user
const checkUser = (req, res, next) => {
    // const token = req.cookies.jwt;
    // if (token) {
    //   jwt.verify(token, 'travel', async (err, decodedToken) => {
    //     if (err) {
    //       return res.status(401).json({
    //         isSuccess: false,
    //         message: 'Error',
    //         data: null
    //     });
    //     } else {
    //       let user = await User.findById(decodedToken.id);
    //       res.locals.user = user;
    //       next();
    //     }
    //   });
    // } else {
    //   return res.status(401).json({
    //     isSuccess: false,
    //     message: 'Token không hợp lệ hoặc không tồn tại.',
    //     data: null
    // });
    // }
    
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    console.log('TokenA::', token);

    if (!token) {
      return res.status(401).json({
          isSuccess: false,
          message: 'Token không hợp lệ hoặc không tồn tại.',
          data: null
      }); 
    }

  // Giải mã token
    jwt.verify(token, 'travel', async (err, decoded) => {
      if (err) {
          return res.status(403).json({
              isSuccess: false,
              message: 'Token không hợp lệ.',
              data: null
          });
      }
      let user = await User.findById(decoded.id);
      res.locals.user = user;
      next();
    });
  };

//check is location owner?
const checkLocationOwner = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({
        isSuccess: false,
        message: 'Token không hợp lệ hoặc không tồn tại.',
        data: null
    });
  }

// Giải mã token
  jwt.verify(token, 'travel', async (err, decoded) => {
    if (err) {
        return res.status(403).json({
            isSuccess: false,
            message: 'Token không hợp lệ.',
            data: null
        });
    }
    let user = await User.findById(decoded.id);
    res.locals.user = user;
    // Kiểm tra quyền
    if (res.locals.user.userRole !== 'location-owner') {
        return res.status(403).json({
            isSuccess: false,
            message: 'Bạn không có quyền truy cập vào trang này',
            data: null
        });
    }
    next();
  });
};

const checkAdmin = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({
        isSuccess: false,
        message: 'Token không hợp lệ hoặc không tồn tại.',
        data: null
    });
  }

// Giải mã token
  jwt.verify(token, 'travel', async (err, decoded) => {
    if (err) {
        return res.status(403).json({
            isSuccess: false,
            message: 'Token không hợp lệ.',
            data: null
        });
    }
    let user = await User.findById(decoded.id);
    res.locals.user = user;
    // Kiểm tra quyền
    if (res.locals.user.userRole !== 'admin') {
        return res.status(403).json({
            isSuccess: false,
            message: 'Bạn không có quyền truy cập vào trang này',
            data: null
        });
    }
    next();
  });
};
module.exports = {requireAuth, checkUser, checkLocationOwner, checkAdmin, verifyConnectSocket};