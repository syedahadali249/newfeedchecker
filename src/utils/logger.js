function createLogger(enabled = true) {
  return {
    log(stage, data) {
      if (!enabled) return;
      console.log(`[${stage}]`, data);
    },
  };
}

module.exports = { createLogger };