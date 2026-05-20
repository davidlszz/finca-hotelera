const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../database/config.json');

const readConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
};

const writeConfig = (data) => {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
};

exports.getConfig = (req, res) => {
  res.json(readConfig());
};

exports.updateConfig = (req, res) => {
  try {
    const current = readConfig();
    const updated = { ...current, ...req.body };
    writeConfig(updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar configuración.' });
  }
};
