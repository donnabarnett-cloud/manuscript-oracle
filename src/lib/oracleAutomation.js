/**
 * oracleAutomation.js - Background Consistency Monitor for Manuscript Oracle
 * This script runs in the background to ensure POV consistency, plot hole prevention, and global prose polish.
 */

import { getNovelById } from './indexedDb';
import { analyzeManuscriptHealth } from './oracleEngine';

export const startOracleMonitor = (novelId, intervalMinutes = 30) => {
  console.log(`Oracle Monitor started for novel: ${novelId}`);
  
  const monitorTask = async () => {
    const novel = await getNovelById(novelId);
    if (!novel) return;

    console.log('Running background manuscript analysis...');
    const healthReport = await analyzeManuscriptHealth(novelId);
    
    // Auto-alert if critical issues found
    if (healthReport.criticalIssues > 0) {
      console.warn('Oracle Monitor: Critical issues detected in manuscript health.');
    }
  };

  const intervalId = setInterval(monitorTask, intervalMinutes * 60 * 1000);
  return () => clearInterval(intervalId);
};

export const runGlobalConsistencyCheck = async (novelId) => {
  const report = await analyzeManuscriptHealth(novelId);
  return {
    timestamp: new Date().toISOString(),
    status: report.score > 80 ? 'Stable' : 'Unstable',
    issues: report.suggestions
  };
};
