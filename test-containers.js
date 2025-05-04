const http = require('http');
const { execSync } = require('child_process');

// Function to make an HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to check Docker container status
function checkDockerContainers() {
  try {
    const output = execSync('docker ps --format "{{.Names}}: {{.Status}}"').toString();
    return output.split('\n').filter(Boolean);
  } catch (err) {
    return [`Error checking containers: ${err.message}`];
  }
}

// Main test function
async function runTests() {
  console.log('=== MarkoTronix Container Tests ===');
  console.log('\n1. Checking Docker containers:');
  
  const containers = checkDockerContainers();
  containers.forEach(container => {
    console.log(`   ${container}`);
  });
  
  console.log('\n2. Testing API container:');
  try {
    const apiResponse = await makeRequest('http://localhost:8000/api/container-test');
    console.log(`   Status: ${apiResponse.statusCode}`);
    console.log(`   Response: ${JSON.stringify(apiResponse.data, null, 2)}`);
  } catch (err) {
    console.log(`   Error: ${err.message}`);
  }
  
  console.log('\n3. Testing UI container health:');
  try {
    const uiHealthResponse = await makeRequest('http://localhost:3000/api/health');
    console.log(`   Status: ${uiHealthResponse.statusCode}`);
    console.log(`   Response: ${JSON.stringify(uiHealthResponse.data, null, 2)}`);
  } catch (err) {
    console.log(`   Error: ${err.message}`);
  }
  
  console.log('\n4. Testing UI container test endpoint:');
  try {
    const uiTestResponse = await makeRequest('http://localhost:3000/api/container-test');
    console.log(`   Status: ${uiTestResponse.statusCode}`);
    console.log(`   Response: ${JSON.stringify(uiTestResponse.data, null, 2)}`);
  } catch (err) {
    console.log(`   Error: ${err.message}`);
  }
  
  console.log('\n=== Tests Completed ===');
}

// Run the tests
runTests().catch(err => {
  console.error('Test error:', err);
});