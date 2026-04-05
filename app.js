require("dotenv").config({ override: false });

console.log("DATABASE_URL:", process.env.DATABASE_URL);
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db");
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   BASE
========================= */
app.get("/", (req, res) => {
  res.send("API Fluxo funcionando");
});

/* =========================
   USERS
========================= */
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      "INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING id,name,email",
      [name, email, hashedPassword]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email já cadastrado" });
    }
    res.status(500).json({ error: "Erro ao registrar" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: "Senha inválida" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });

  } catch {
    res.status(500).json({ error: "Erro login" });
  }
});

/* =========================
   FLOWS
========================= */
app.post("/start-flow", async (req, res) => {
  const { user_id, platform, zone } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO flows (user_id,platform,zone,started_at)
       VALUES ($1,$2,$3,NOW())
       RETURNING *`,
      [user_id, platform, zone]
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Erro start-flow" });
  }
});

app.post("/finish-flow", async (req, res) => {
  const { flow_id, value, km } = req.body;

  try {
    const result = await db.query(
      `UPDATE flows
       SET finished_at=NOW(),
           duration_minutes=EXTRACT(EPOCH FROM (NOW()-started_at))/60,
           value=$2,
           km=$3
       WHERE id=$1
       RETURNING *`,
      [flow_id, Number(value), Number(km)]
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Erro finish-flow" });
  }
});

app.get("/flows/:user_id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM flows WHERE user_id=$1 ORDER BY created_at DESC",
      [req.params.user_id]
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Erro flows" });
  }
});

/* =========================
   CORE ENGINE (REUTILIZÁVEL)
========================= */

async function getZoneData() {

  let result = await db.query(`
    SELECT 
      zone,
      COUNT(*) as total_flows,
      AVG(value) as avg_value,
      AVG(duration_minutes) as avg_time,
      AVG(value) FILTER (WHERE created_at > NOW() - INTERVAL '30 minutes') as recent_value,
      AVG(value) FILTER (
        WHERE created_at BETWEEN 
        NOW() - INTERVAL '60 minutes' AND NOW() - INTERVAL '30 minutes'
      ) as past_value
    FROM flows
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY zone
  `);

  if (result.rows.length === 0) {
    result = await db.query(`
      SELECT 
        zone,
        COUNT(*) as total_flows,
        AVG(value) as avg_value,
        AVG(duration_minutes) as avg_time,
        0 as recent_value,
        0 as past_value
      FROM flows
      GROUP BY zone
    `);
  }

  return result.rows;
}

function calculateZoneScore(z) {

  const total = Number(z.total_flows) || 0;
  const avgValue = Number(z.avg_value) || 0;
  const avgTime = Math.max(Number(z.avg_time) || 1, 1);

  const valuePerMin = avgValue / avgTime;

  const recent = Number(z.recent_value) || 0;
  const past = Number(z.past_value) || 0;

  let activity = total >= 5 ? "alto" : total >= 2 ? "medio" : "baixo";
  let quality = valuePerMin > 1 ? "boa" : valuePerMin >= 0.6 ? "media" : "ruim";

  let trend = "neutro";
  if (recent > past * 1.1) trend = "subindo";
  else if (recent < past * 0.9) trend = "caindo";

  let confidence = total >= 6 ? "alta" : total >= 3 ? "media" : "baixa";

  const score =
    (activity === "alto" ? 100 : activity === "medio" ? 70 : 30) * 0.4 +
    (quality === "boa" ? 100 : quality === "media" ? 70 : 30) * 0.3 +
    (trend === "subindo" ? 100 : trend === "neutro" ? 60 : 30) * 0.2 +
    (confidence === "alta" ? 100 : confidence === "media" ? 70 : 30) * 0.1;

  return {
    activity,
    quality,
    trend,
    confidence,
    score: Math.round(Math.min(score, 100)),
    valuePerMin
  };
}

/* =========================
   ZONES
========================= */
app.get("/zones", async (req, res) => {
  try {
    const rows = await getZoneData();

    const zones = rows.map(z => {
      const calc = calculateZoneScore(z);
      return {
        zone: z.zone,
        ...calc,
        total_flows: Number(z.total_flows),
        value_per_min: calc.valuePerMin.toFixed(2)
      };
    });

    zones.sort((a,b) => b.score - a.score);

    res.json(zones);

  } catch {
    res.status(500).json({ error: "Erro zones" });
  }
});

/* =========================
   RECOMMENDATION
========================= */
app.get("/recommendation", async (req, res) => {
  try {
    const rows = await getZoneData();

    const zones = rows.map(z => {
      const calc = calculateZoneScore(z);
      return { zone: z.zone, ...calc };
    });

    zones.sort((a,b) => b.score - a.score);

    res.json({
      recommendation: zones[0] || null,
      all_zones: zones
    });

  } catch {
    res.status(500).json({ error: "Erro recommendation" });
  }
});

/* =========================
   USER PERFORMANCE
========================= */
app.get("/user-performance/:user_id", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT zone, platform,
             COUNT(*) as total_flows,
             AVG(value) as avg_value,
             AVG(duration_minutes) as avg_time
      FROM flows
      WHERE user_id=$1
      GROUP BY zone, platform
    `, [req.params.user_id]);

    const data = result.rows.map(r => {
      const vpm =
        Number(r.avg_value) / Math.max(Number(r.avg_time),1);

      return {
        zone: r.zone,
        platform: r.platform,
        total_flows: Number(r.total_flows),
        value_per_min: vpm.toFixed(2)
      };
    });

    res.json(data);

  } catch {
    res.status(500).json({ error: "Erro performance" });
  }
});

/* =========================
   PLATFORM RECOMMENDATION
========================= */
app.get("/recommendation/platform/:zone", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT platform,
             COUNT(*) as total_flows,
             AVG(value) as avg_value,
             AVG(duration_minutes) as avg_time
      FROM flows
      WHERE zone=$1
      GROUP BY platform
    `, [req.params.zone]);

    const platforms = result.rows.map(p => {
      const vpm =
        Number(p.avg_value) / Math.max(Number(p.avg_time),1);

      return {
        platform: p.platform,
        total_flows: Number(p.total_flows),
        value_per_min: vpm
      };
    });

    platforms.sort((a,b) => b.value_per_min - a.value_per_min);

    res.json({
      best_platform: platforms[0] || null,
      all_platforms: platforms
    });

  } catch {
    res.status(500).json({ error: "Erro plataforma" });
  }
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard/:user_id", async (req, res) => {
  try {

    const rows = await getZoneData();

    if (rows.length === 0) {
      return res.json({ recommendation: null, zones: [] });
    }

    const zones = rows.map(z => {
      const calc = calculateZoneScore(z);
      return { zone: z.zone, ...calc };
    });

    zones.sort((a,b) => b.score - a.score);

    const best = zones[0];

    const platformResult = await db.query(`
      SELECT platform,
             AVG(value) as avg_value,
             AVG(duration_minutes) as avg_time
      FROM flows
      WHERE zone=$1
      GROUP BY platform
    `, [best.zone]);

    const platforms = platformResult.rows.map(p => {
      const vpm =
        Number(p.avg_value) / Math.max(Number(p.avg_time),1);

      return { platform: p.platform, value_per_min: vpm };
    });

    platforms.sort((a,b) => b.value_per_min - a.value_per_min);

    res.json({
      recommendation: {
        zone: best.zone,
        score: best.score,
        trend: best.trend,
        activity: best.activity,
        confidence: best.confidence,
        best_platform: platforms[0]?.platform || "ifood"
      },
      zones
    });

  } catch {
    res.status(500).json({ error: "Erro dashboard" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
