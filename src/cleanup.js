const core = require('@actions/core');
const fs = require('fs');

/**
 * Cleanup function that runs after the main action
 */
async function cleanup() {
  try {
    const settingsPath = core.getState('settings-file') || core.getInput('maven-settings-path');
    
    if (settingsPath && fs.existsSync(settingsPath)) {
      core.info(`Cleaning up settings file: ${settingsPath}`);
      fs.unlinkSync(settingsPath);
      core.info('Settings file cleaned up successfully');
    }
  } catch (error) {
    core.warning(`Failed to cleanup settings file: ${error.message}`);
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanup();
}

module.exports = { cleanup };