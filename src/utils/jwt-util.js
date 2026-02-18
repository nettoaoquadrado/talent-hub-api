const jwt = require('jsonwebtoken');
const config = require('../config/config');

// @ts-ignore
module.exports.genToken = async (payload) =>
  jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
