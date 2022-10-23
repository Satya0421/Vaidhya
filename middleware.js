const jwt = require("jsonwebtoken");
const config = require("./jwtconfig");

let checkToken = (req, res, next) => {
  let token = req.headers["authorization"];
  if (token!=null) {
    token = token.substring(7);
    jwt.verify(token, config.key, (err, decoded) => {
      if (err) {
        return res.status(500).json({
          status: false,
          msg: "token is invalid",
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(500).json({
      status: false,
      msg: "Token is not provided",
    });
  }
};

module.exports = {
  checkToken: checkToken,
 };