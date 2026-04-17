let databaseConnected = false;

const setDatabaseConnected = (connected) => {
  databaseConnected = Boolean(connected);
};

const isDatabaseConnected = () => databaseConnected;

module.exports = {
  setDatabaseConnected,
  isDatabaseConnected,
};
