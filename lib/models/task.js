'use strict';
class Task {
  constructor({ ui, analytics, testing, settings } = {}) {
    this.ui = ui;
    this.analytics = analytics;
    this.testing = testing;
    this.settings = settings;
  }

  run(/*options*/) {
    throw new Error('Task needs to have run() defined.');
  }

  /**
   * Interrupt comamd with an exit code
   * Called when the process is interrupted from outside, e.g. CTRL+C or `process.kill()`
   *
   * @private
   * @method onInterrupt
   */
  onInterrupt() {
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
}

module.exports = Task;
