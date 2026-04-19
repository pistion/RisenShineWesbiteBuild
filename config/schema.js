const fs = require("fs/promises");
const path = require("path");

let schemaEnsured = false;

const ensureSchema = async (client) => {
  if (schemaEnsured) {
    return;
  }

  const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await client.query(schemaSql);
  schemaEnsured = true;
};

module.exports = {
  ensureSchema,
};
