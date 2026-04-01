const userBusiness = require('./user-business');

module.exports.findById = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;

  const user = await userBusiness.findById({ id, currentUser });

  return h.response(user).code(200);
};

module.exports.findMany = async (req, h) => {
  const data = await userBusiness.findMany({
    ...req.query,
  });
  return h.response(data).code(200);
};

module.exports.auth = async (req, h) => {
  const { email, password } = req.payload;

  const authResponse = await userBusiness.auth({ email, password });

  return h.response(authResponse).code(200);
};

module.exports.changePassword = async (req, h) => {
  const { oldPassword, newPassword } = req.payload;
  const currentUser = req.auth.credentials;

  await userBusiness.changePassword({
    currentUser,
    oldPassword,
    newPassword,
  });

  return h.response().code(204);
};
