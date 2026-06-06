const express = require("express");
const axios = require("axios");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Backend is running");
});


db.query(`
CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  followers INT,
  following INT,
  public_repos INT
)
`, (err) => {
  if (err) {
    console.log("Table create error:", err);
  } else {
    console.log("Table ready ✔");
  }
});


app.get("/github/:username", async (req, res) => {
  try {
    const username = req.params.username;

    console.log("Fetching GitHub user:", username);

    const response = await axios.get(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    const data = response.data;

    const sql =
      "INSERT INTO profiles (username, followers, following, public_repos) VALUES (?, ?, ?, ?)";

    db.query(
      sql,
      [data.login, data.followers, data.following, data.public_repos],
      (err) => {
        if (err) {
          console.log("DB Insert Error:", err);
          return res.status(500).json({ error: "DB insert failed" });
        }

        res.json({
          message: "Saved to MySQL successfully",
          username: data.login,
          followers: data.followers,
          repos: data.public_repos
        });
      }
    );

  } catch (error) {
    console.log("GitHub API Error:", error.message);

    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "GitHub user not found" });
    }

    if (error.response && error.response.status === 403) {
      return res.status(403).json({ error: "GitHub API rate limit exceeded" });
    }

    return res.status(500).json({ error: "Server error while fetching GitHub data" });
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});