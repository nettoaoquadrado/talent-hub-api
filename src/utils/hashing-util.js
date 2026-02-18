const bcrypt = require('bcrypt');

module.exports.hash = async (data) => {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(data, salt);
  return hashed;
};

module.exports.compare = async (data, hashedData) => {
  const isMatch = await bcrypt.compare(data, hashedData);
  return isMatch;
};
