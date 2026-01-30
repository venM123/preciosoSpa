module.exports = function requireCustomer(req, res, next) {
  if (req.session && req.session.customerId) {
    return next();
  }
  return res.redirect("/customer/login");
};
