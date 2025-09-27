// Simple JWT-like implementation for testing (base64url encoding/decoding)
function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str) {
  return Buffer.from(str, 'base64url').toString();
}

function createSignature(data, secret) {
  // Simple HMAC-like signature for testing
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function createJWT(header, payload, secret) {
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createSignature(data, secret);
  return `${data}.${signature}`;
}

function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expectedSignature = createSignature(data, secret);

  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  const decodedPayload = JSON.parse(base64UrlDecode(payload));
  return decodedPayload;
}

function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

// Test token generation and verification
async function testToken() {
  console.log('=== JWT Token Test ===');

  const accessSecret = process.env.JWT_ACCESS_SECRET || 'change_me';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'change_me_refresh';

  console.log('Access Secret:', accessSecret);
  console.log('Refresh Secret:', refreshSecret);

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    typ: 'access'
  };

  try {
    // Generate access token
    const accessToken = createJWT(header, payload, accessSecret);
    console.log('Generated Access Token:', accessToken.substring(0, 50) + '...');

    // Decode access token
    const decoded = decodeJWT(accessToken);
    console.log('Decoded Access Token:', decoded);

    // Verify access token
    const verified = verifyJWT(accessToken, accessSecret);
    console.log('Verified Access Token:', verified);

    // Test with wrong secret
    try {
      const wrongVerified = verifyJWT(accessToken, 'wrong_secret');
      console.log('ERROR: Token verified with wrong secret!');
    } catch (err) {
      console.log('Correctly failed verification with wrong secret:', err.message);
    }

    // Test with refresh token type
    const refreshPayload = { ...payload, typ: 'refresh' };
    const refreshToken = createJWT(header, refreshPayload, refreshSecret);

    try {
      // Try to verify refresh token with access secret
      const refreshVerified = verifyJWT(refreshToken, accessSecret);
      console.log('ERROR: Refresh token verified with access secret!');
    } catch (err) {
      console.log('Correctly failed refresh token verification with access secret:', err.message);
    }

  } catch (err) {
    console.error('Token test failed:', err.message);
  }
}

// Test environment variables
function testEnvironment() {
  console.log('\n=== Environment Variables Test ===');

  const requiredVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'AUTH_GRPC_URL'
  ];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value && value.trim().length > 0 ? '✅ SET' : '❌ NOT SET';
    console.log(`${varName}: ${status} ${value ? `(value: ${value.substring(0, 20)}...)` : ''}`);
  });
}

// Run tests
async function runTests() {
  console.log('🔧 Auth Debug Test Started\n');

  testEnvironment();
  await testToken();

  console.log('\n=== Recommendations ===');
  console.log('1. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in environment variables');
  console.log('2. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured');
  console.log('3. Verify AUTH_GRPC_URL matches between services');
  console.log('4. Make sure the auth microservice is running on the correct port');
  console.log('5. Check that Supabase credentials are valid and the user exists');
}

runTests().catch(console.error);
