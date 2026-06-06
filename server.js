const express = require("express");
const axios = require("axios");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});


app.get("/github/:username", async (req, res) => {
  try {
    const username = req.params.username;

    const response = await axios.get(
      `https://api.github.com/users/${username}`
    );

    const data = response.data;

    const sql =
      "INSERT INTO profiles (username, followers, following, public_repos) VALUES (?, ?, ?, ?)";

    db.query(
      sql,
      [data.login, data.followers, data.following, data.public_repos],
      (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "DB insert failed" });
        }

        res.json({
          message: "Saved to MySQL successfully 🚀",
          username: data.login,
          followers: data.followers,
          repos: data.public_repos
        });
      }
    );

  } catch (error) {
    res.status(500).json({ error: "User not found" });
  }
});

app.get("/profiles", (req, res) => {
  const sql = "SELECT * FROM profiles";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "DB fetch failed" });
    }

    res.json(results);
  });
});

app.get("/profile/:id", (req, res) => {
  const sql = "SELECT * FROM profiles WHERE id = ?";

  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "DB fetch failed" });
    }

    res.json(results[0]);
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});