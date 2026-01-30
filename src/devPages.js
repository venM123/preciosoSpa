const express = require("express");
const router = express.Router();

router.get("/admin-login", (req, res) => {
  res.send(`
    <h2>Admin Login (DEV)</h2>
    <form method="POST" action="/admin/login">
      <label>Email</label><br/>
      <input name="email" value="admin@ladyboss.local" /><br/><br/>
      <label>Password</label><br/>
      <input name="password" type="password" value="Admin123!" /><br/><br/>
      <button type="submit">Login</button>
    </form>
    <p>After login, open <a href="/admin/me">/admin/me</a></p>
  `);
});

module.exports = router;
