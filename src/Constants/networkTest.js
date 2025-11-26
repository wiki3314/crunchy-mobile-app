/**
 * Network Connectivity Test Utility
 * Use this to test if your mobile app can reach the backend
 */

import { BASE_URL } from "./apiHandler";

/**
 * Test network connectivity to the backend
 * @returns {Promise<Object>} Test results with status and message
 */
export const testBackendConnection = async () => {
  console.log("🔍 NETWORK TEST - Starting...");
  console.log("📍 Testing connection to:", BASE_URL);

  const results = {
    baseUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    tests: [],
  };

  // Test 1: Basic fetch to docs endpoint
  try {
    console.log("Test 1: Checking if backend is reachable...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(BASE_URL.replace("/api/", "/api/docs"), {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    results.tests.push({
      name: "Backend Reachability",
      status: response.ok ? "PASS" : "FAIL",
      statusCode: response.status,
      message: response.ok
        ? "✅ Backend is reachable"
        : `❌ Backend responded with status ${response.status}`,
    });

    console.log("✅ Test 1: Backend is reachable");
  } catch (error) {
    results.tests.push({
      name: "Backend Reachability",
      status: "FAIL",
      error: error.message,
      code: error.code,
      message: `❌ Cannot reach backend: ${error.message}`,
    });
    console.error("❌ Test 1 Failed:", error.message);
  }

  // Test 2: Test login endpoint availability
  try {
    console.log("Test 2: Checking login endpoint...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(BASE_URL + "login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@test.com",
        password: "test",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // We expect 401 or 400, not a connection error
    const isEndpointWorking =
      response.status === 400 || response.status === 401 || response.ok;

    results.tests.push({
      name: "Login Endpoint",
      status: isEndpointWorking ? "PASS" : "FAIL",
      statusCode: response.status,
      message: isEndpointWorking
        ? "✅ Login endpoint is responding"
        : `❌ Login endpoint responded with unexpected status ${response.status}`,
    });

    console.log("✅ Test 2: Login endpoint is responding");
  } catch (error) {
    results.tests.push({
      name: "Login Endpoint",
      status: "FAIL",
      error: error.message,
      code: error.code,
      message: `❌ Cannot reach login endpoint: ${error.message}`,
    });
    console.error("❌ Test 2 Failed:", error.message);
  }

  // Summary
  const passedTests = results.tests.filter((t) => t.status === "PASS").length;
  const totalTests = results.tests.length;
  const allPassed = passedTests === totalTests;

  results.summary = {
    passed: passedTests,
    total: totalTests,
    allPassed: allPassed,
    message: allPassed
      ? "✅ All network tests passed! Backend is accessible."
      : `❌ ${
          totalTests - passedTests
        } of ${totalTests} tests failed. Check network configuration.`,
  };

  console.log("🔍 NETWORK TEST RESULTS:");
  console.log(JSON.stringify(results, null, 2));

  return results;
};

/**
 * Quick test that returns true if backend is reachable
 * @returns {Promise<boolean>}
 */
export const isBackendReachable = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(BASE_URL.replace("/api/", "/api/docs"), {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Backend not reachable:", error.message);
    return false;
  }
};

/**
 * Get network diagnostics info
 */
export const getNetworkDiagnostics = () => {
  const diagnostics = {
    baseUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    tips: [
      "1. Make sure the backend is running (check terminal for 'Application is running on...')",
      "2. Verify your device is on the same WiFi network as your computer",
      "3. Check the IP address in BASE_URL matches your computer's IP",
      "4. For Android emulator, use 10.0.2.2 instead of localhost",
      "5. For iOS simulator, you can use localhost or your machine's IP",
      "6. Make sure your firewall allows connections on port 3000",
      "7. Try pinging the backend from your terminal: curl " +
        BASE_URL +
        "docs",
    ],
  };

  console.log("📋 NETWORK DIAGNOSTICS:");
  console.log(JSON.stringify(diagnostics, null, 2));

  return diagnostics;
};
