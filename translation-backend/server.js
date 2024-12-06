// Import required modules
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config(); // Load environment variables from .env file

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
// app.use(bodyParser.json());
app.use(express.json());

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint to save a translation
app.post("192.168.5.8/api/translations", async (req, res) => {
  const { original_message, translated_message, language, model, score } = req.body;

  // Validate input
  if (!original_message || !translated_message || !language || !model || typeof score !== 'number') {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Insert translation into the database
    const { data, error } = await supabase
      .from("translations") // Make sure the table exists in Supabase
      .insert([{ original_message, translated_message, language, model}]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (error) {
    console.error("Error saving translation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to fetch previous translations
app.get("192.168.5.8/api/translations", async (req, res) => {
  try {
    // Fetch translations from the database
    const { data, error } = await supabase
      .from("translations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching translations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to save a comparison translation
app.post("192.168.5.8/api/compareTranslate", async (req, res) => {
  const { original_message, translated_message, language, model, score } = req.body;

  // Validate input
  if (!original_message || !translated_message || !language || !model || typeof score !== 'number') {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Insert comparison translation into the database
    const { data, error } = await supabase
      .from("192.168.5.8/api/compareTranslate") // Make sure the table exists in Supabase
      .insert([{ original_message, translated_message, language, model, score }]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (error) {
    console.error("Error saving compare translation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to fetch previous comparison translations
app.get("192.168.5.8/api/compare-translations", async (req, res) => {
  try {
    // Fetch comparison translations from the database
    const { data, error } = await supabase
      .from("compareTranslate")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching compare translations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


