const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run a test script and log the output
function runTest(scriptPath, logFile) {
  console.log(`Running test: ${path.basename(scriptPath)}`);
  
  try {
    const output = execSync(`node ${scriptPath}`).toString();
    fs.writeFileSync(logFile, output);
    console.log(`Test completed successfully. Log saved to ${logFile}`);
    return true;
  } catch (err) {
    console.error(`Test failed: ${err.message}`);
    fs.writeFileSync(logFile, err.message);
    return false;
  }
}

// Function to open the container test page in the browser
function openContainerTestPage() {
  console.log('Opening container test page in browser...');
  
  try {
    execSync('start http://localhost:28000/container-test');
    console.log('Container test page opened in browser');
    return true;
  } catch (err) {
    console.error(`Failed to open container test page: ${err.message}`);
    return false;
  }
}

// Main function to run all tests
function runAllTests() {
  console.log('=== Running All Container Tests ===\n');
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  
  // Run container tests
  const testScripts = [
    {
      script: path.join(__dirname, 'test-containers.js'),
      log: path.join(logsDir, 'container-test.log')
    },
    {
      script: path.join(__dirname, 'test-container-resources.js'),
      log: path.join(logsDir, 'container-resources-test.log')
    }
  ];
  
  let allTestsPassed = true;
  
  for (const test of testScripts) {
    const testPassed = runTest(test.script, test.log);
    allTestsPassed = allTestsPassed && testPassed;
    console.log('');
  }
  
  // Open container test page in browser
  openContainerTestPage();
  
  console.log('\n=== All Tests Completed ===');
  console.log(`Overall status: ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Test report: ${path.join(__dirname, 'container-test-report.md')}`);
}

// Run all tests
runAllTests();