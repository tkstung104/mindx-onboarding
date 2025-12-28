/**
 * OpenID Connect Authentication Server - MindX Integration (Production)
 * 
 * Server này implement OpenID Connect flow với MindX Identity Provider
 * ở mức low level để hiểu rõ cách hoạt động.
 * 
 * Production version với CORS configuration và environment variables
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Environment check
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tungha104.id.vn';

// MindX OAuth Configuration
const CLIENT_ID = process.env.MINDX_CLIENT_ID || 'mindx-onboarding';
const CLIENT_SECRET = process.env.MINDX_CLIENT_SECRET || 'cHJldmVudGJvdW5kYmF0dHJlZWV4cGxvcmVjZWxsbmVydm91c3ZhcG9ydGhhbnN0ZWU=';

// MindX OpenID Configuration (từ openid-configuration.json)
const MINDX_ISSUER = 'https://id-dev.mindx.edu.vn';
const MINDX_JWKS_URI = 'https://id-dev.mindx.edu.vn/jwks';
const MINDX_AUTHORIZATION_ENDPOINT = 'https://id-dev.mindx.edu.vn/auth';
const MINDX_TOKEN_ENDPOINT = 'https://id-dev.mindx.edu.vn/token';
const MINDX_USERINFO_ENDPOINT = 'https://id-dev.mindx.edu.vn/me';

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration: Production chỉ cho phép domain cụ thể
app.use(cors({
    origin: isProduction 
        ? [
            FRONTEND_URL,
            'https://tungha104.id.vn',
            'http://tungha104.id.vn', // Nếu có HTTP
            'http://4.144.170.166',    // Load balancer IP (nếu cần)
          ]
        : true, // Development: cho phép tất cả
    credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// TYPES & INTERFACES
// ============================================

interface JWK {
    kty: string;  // Key type (RSA)
    use: string;  // Public key use (sig = signature)
    kid: string;  // Key ID
    n: string;    // Modulus (RSA public key component)
    e: string;    // Exponent (RSA public key component)
    alg: string;  // Algorithm (RS256)
}

interface JWKSResponse {
    keys: JWK[];
}

interface MindXTokenPayload {
    iss: string;                    // Issuer (https://id-dev.mindx.edu.vn)
    aud: string;                    // Audience (Client ID)
    sub: string;                    // Subject (User ID)
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    preferred_username?: string;
    exp: number;                    // Expiration time (Unix timestamp)
    iat: number;                    // Issued at (Unix timestamp)
    auth_time?: number;              // Authentication time
    sid?: string;                   // Session ID
}

interface LoginRequest {
    token: string;
}

interface LoginResponse {
    success: boolean;
    user?: {
        id: string;
        name: string;
        email?: string;
        username?: string;
    };
    message?: string;
}

// ============================================
// JWKS CACHE
// ============================================

/**
 * Cache để lưu MindX's public keys
 * Tránh fetch lại mỗi lần verify token
 */
let cachedKeys: Map<string, string> = new Map(); // Map<kid, publicKeyPEM>
let keysExpiry: number = 0; // Thời gian hết hạn của cache (1 giờ)

// ============================================
// STEP 1: FETCH MINDX PUBLIC KEYS (JWKS)
// ============================================

/**
 * JWKS (JSON Web Key Set) là tập hợp các public keys mà MindX dùng để ký JWT tokens.
 * 
 * Flow:
 * 1. MindX ký JWT token bằng private key → tạo signature
 * 2. JWT header chứa "kid" (key ID) để chỉ ra dùng key nào
 * 3. Backend lấy public key từ JWKS endpoint
 * 4. Dùng public key để verify signature
 * 
 * @returns Map của kid → publicKeyPEM
 */
async function fetchMindXPublicKeys(): Promise<Map<string, string>> {
    // Kiểm tra cache trước
    const now = Date.now();
    if (cachedKeys.size > 0 && now < keysExpiry) {
        console.log('📦 Sử dụng cached public keys');
        return cachedKeys;
    }

    console.log('🌐 Đang fetch MindX public keys từ JWKS endpoint...');
    console.log(`📍 JWKS URI: ${MINDX_JWKS_URI}`);
    
    try {
        const response = await fetch(MINDX_JWKS_URI);
        if (!response.ok) {
            throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
        }

        const jwks: JWKSResponse = await response.json();
        
        // Convert JWK format → PEM format (format mà Node.js crypto cần)
        const keysMap = new Map<string, string>();
        
        for (const key of jwks.keys) {
            // JWK format: { n: base64url, e: base64url }
            // PEM format: -----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
            
            const publicKey = createPublicKey({
                key: {
                    kty: key.kty,
                    n: key.n,
                    e: key.e,
                },
                format: 'jwk',
            });
            
            const publicKeyPEM = publicKey.export({
                type: 'spki',
                format: 'pem',
            }) as string;
            
            keysMap.set(key.kid, publicKeyPEM);
        }

        // Cache keys trong 1 giờ
        cachedKeys = keysMap;
        keysExpiry = now + 60 * 60 * 1000; // 1 giờ
        
        console.log(`✅ Đã lấy ${keysMap.size} public keys từ MindX`);
        return keysMap;
        
    } catch (error: any) {
        console.error('❌ Lỗi khi fetch MindX public keys:', error.message);
        throw error;
    }
}

// ============================================
// STEP 2: DECODE JWT HEADER
// ============================================

/**
 * JWT token có 3 phần: header.payload.signature
 * - Header: chứa algorithm và kid (key ID)
 * - Payload: chứa claims (iss, aud, exp, sub, email, name, ...)
 * - Signature: chữ ký để verify
 * 
 * Bước này chỉ decode để lấy kid từ header, chưa verify gì cả.
 */
function decodeJWTHeader(token: string): { kid: string; alg: string } {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format: phải có 3 phần (header.payload.signature)');
        }

        // Decode header (base64url → JSON)
        const headerBase64 = parts[0];
        const headerJson = Buffer.from(headerBase64, 'base64url').toString('utf-8');
        const header = JSON.parse(headerJson);

        if (!header.kid) {
            throw new Error('JWT header thiếu kid (key ID)');
        }

        return {
            kid: header.kid,
            alg: header.alg || 'RS256',
        };
    } catch (error: any) {
        throw new Error(`Failed to decode JWT header: ${error.message}`);
    }
}

// ============================================
// STEP 3: VERIFY JWT TOKEN (LOW LEVEL)
// ============================================

/**
 * Verify JWT token thủ công:
 * 1. Decode header để lấy kid
 * 2. Lấy public key tương ứng với kid
 * 3. Verify signature bằng public key
 * 4. Verify claims (iss, aud, exp, ...)
 * 
 * @param token - MindX ID Token (JWT)
 * @returns Decoded payload nếu token hợp lệ
 */
async function verifyMindXIdToken(token: string): Promise<MindXTokenPayload> {
    console.log('🔍 Bắt đầu verify token...');

    // 1. Decode header để lấy kid
    const { kid, alg } = decodeJWTHeader(token);
    console.log(`🔑 JWT token sử dụng key ID: ${kid}, algorithm: ${alg}`);

    // Chỉ chấp nhận RS256 (RSA + SHA256) - theo openid-configuration.json
    if (alg !== 'RS256') {
        throw new Error(`Unsupported algorithm: ${alg}. Chỉ chấp nhận RS256`);
    }

    // 2. Lấy public keys từ MindX
    const publicKeys = await fetchMindXPublicKeys();
    const publicKeyPEM = publicKeys.get(kid);

    if (!publicKeyPEM) {
        throw new Error(`Public key với kid=${kid} không tìm thấy trong JWKS. Có thể MindX đã rotate keys.`);
    }

    // 3. Verify signature và decode payload
    // jsonwebtoken.verify() sẽ:
    // - Verify signature bằng public key
    // - Verify exp (expiration) tự động
    // - Trả về decoded payload nếu hợp lệ
    let payload: any;
    
    try {
        payload = jwt.verify(token, publicKeyPEM, {
            algorithms: ['RS256'],
        }) as MindXTokenPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token đã hết hạn');
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error(`Token không hợp lệ: ${error.message}`);
        }
        throw error;
    }

    // 4. Verify claims thủ công (iss, aud)
    // Note: jsonwebtoken.verify() không tự verify iss và aud, nên phải làm thủ công
    
    // Verify issuer (phải là MindX)
    if (payload.iss !== MINDX_ISSUER) {
        throw new Error(`Invalid issuer: ${payload.iss}. Phải là ${MINDX_ISSUER}`);
    }

    // Verify audience (phải là CLIENT_ID của bạn)
    if (payload.aud !== CLIENT_ID) {
        throw new Error(`Invalid audience: ${payload.aud}. Phải là ${CLIENT_ID}`);
    }

    console.log('✅ Token đã được verify thành công!');
    return payload;
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * POST /api/login
 * 
 * Endpoint để verify MindX ID Token và trả về thông tin user
 */
app.post('/api/login', async (
    req: Request<{}, {}, LoginRequest>, 
    res: Response<LoginResponse>
) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ 
            success: false, 
            message: "Token is required" 
        });
    }

    try {
        // Verify token ở mức low level
        const payload = await verifyMindXIdToken(token);

        // Trích xuất thông tin người dùng
        const { sub, name, email, preferred_username, given_name, family_name } = payload;

        // Tạo display name từ các fields có sẵn
        const displayName = name || 
                           (given_name && family_name ? `${given_name} ${family_name}` : null) ||
                           preferred_username ||
                           sub;

        console.log(`✅ User ${displayName} (${email || sub}) đã xác thực thành công.`);
        console.log(`📋 Token payload:`, {
            sub,
            name: displayName,
            email,
            preferred_username,
            iss: payload.iss,
            aud: payload.aud,
            exp: new Date(payload.exp * 1000).toISOString(),
            iat: new Date(payload.iat * 1000).toISOString(),
        });

        // Phản hồi về Frontend
        res.status(200).json({
            success: true,
            user: {
                id: sub,
                name: displayName,
                email: email,
                username: preferred_username
            }
        });

    } catch (error: any) {
        console.error("❌ Xác thực thất bại:", error.message);
        res.status(401).json({ 
            success: false, 
            message: error.message || "Token không hợp lệ" 
        });
    }
});

/**
 * GET /api/jwks
 * 
 * Endpoint để xem public keys đã cache (debug)
 */
app.get('/api/jwks', async (req: Request, res: Response) => {
    try {
        const keys = await fetchMindXPublicKeys();
        res.json({
            keysCount: keys.size,
            keyIds: Array.from(keys.keys()),
            cacheExpiry: new Date(keysExpiry).toISOString(),
            jwksUri: MINDX_JWKS_URI,
            note: 'Public keys được cache trong 1 giờ'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/health
 * 
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        issuer: MINDX_ISSUER,
        clientId: CLIENT_ID,
        environment: isProduction ? 'production' : 'development',
        frontendUrl: FRONTEND_URL
    });
});

/**
 * GET /api/config
 * 
 * Trả về OpenID configuration (để frontend sử dụng)
 */
app.get('/api/config', (req: Request, res: Response) => {
    res.json({
        issuer: MINDX_ISSUER,
        authorizationEndpoint: MINDX_AUTHORIZATION_ENDPOINT,
        tokenEndpoint: MINDX_TOKEN_ENDPOINT,
        userinfoEndpoint: MINDX_USERINFO_ENDPOINT,
        jwksUri: MINDX_JWKS_URI,
        clientId: CLIENT_ID,
        scopesSupported: ['openid', 'profile', 'email'],
        responseTypesSupported: ['code', 'id_token', 'code id_token']
    });
});

/**
 * POST /api/callback
 * 
 * Endpoint để đổi authorization code lấy ID Token
 * Frontend gửi code lên, backend đổi với MindX token endpoint
 */
interface CallbackRequest {
    code: string;
    redirect_uri: string;
    code_verifier?: string;
}

interface TokenResponse {
    access_token?: string;
    id_token: string;
    token_type?: string;
    expires_in?: number;
}

app.post('/api/callback', async (
    req: Request<{}, {}, CallbackRequest>,
    res: Response<LoginResponse & { idToken?: string }>
) => {
    const { code, redirect_uri, code_verifier } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: "Authorization code is required"
        });
    }

    console.log('📥 Nhận được authorization code từ frontend');
    console.log('🔑 Code:', code.substring(0, 20) + '...');

    try {
        // Đổi code lấy token từ MindX
        console.log('🔄 Đang đổi code lấy token từ MindX...');

        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        });

        // Thêm PKCE nếu có
        if (code_verifier) {
            tokenParams.append('code_verifier', code_verifier);
        }

        const tokenResponse = await fetch(MINDX_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenParams.toString()
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Lỗi từ MindX token endpoint:', errorText);
            throw new Error(`Failed to exchange code: ${tokenResponse.status} ${tokenResponse.statusText}`);
        }

        const tokenData: TokenResponse = await tokenResponse.json();
        console.log('✅ Đã nhận được token từ MindX');

        if (!tokenData.id_token) {
            throw new Error('ID token không có trong response');
        }

        // Verify ID token
        const payload = await verifyMindXIdToken(tokenData.id_token);

        // Trích xuất thông tin người dùng
        const { sub, name, email, preferred_username, given_name, family_name } = payload;

        // Tạo display name
        const displayName = name ||
            (given_name && family_name ? `${given_name} ${family_name}` : null) ||
            preferred_username ||
            sub;

        console.log(`✅ User ${displayName} (${email || sub}) đã xác thực thành công.`);
        console.log(`📋 Token payload:`, {
            sub,
            name: displayName,
            email,
            preferred_username,
            iss: payload.iss,
            aud: payload.aud,
            exp: new Date(payload.exp * 1000).toISOString(),
        });

        // Phản hồi về Frontend
        res.status(200).json({
            success: true,
            user: {
                id: sub,
                name: displayName,
                email: email,
                username: preferred_username
            },
            idToken: tokenData.id_token // Trả về token để frontend có thể dùng (nếu cần)
        });

    } catch (error: any) {
        console.error("❌ Xác thực thất bại:", error.message);
        res.status(401).json({
            success: false,
            message: error.message || "Không thể đổi code lấy token"
        });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 OpenID Connect Authentication Server - MindX (Production)');
    console.log('='.repeat(60));
    console.log(`📍 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🔑 Client ID: ${CLIENT_ID}`);
    console.log(`🌐 Issuer: ${MINDX_ISSUER}`);
    console.log(`📚 JWKS endpoint: ${MINDX_JWKS_URI}`);
    console.log(`🔐 Authorization endpoint: ${MINDX_AUTHORIZATION_ENDPOINT}`);
    console.log(`🎯 Frontend URL: ${FRONTEND_URL}`);
    console.log('='.repeat(60));
    console.log('📡 Endpoints:');
    console.log('   POST /api/login   - Verify MindX ID Token');
    console.log('   POST /api/callback - Exchange code for token');
    console.log('   GET  /api/jwks    - Xem cached public keys');
    console.log('   GET  /api/config  - OpenID configuration');
    console.log('   GET  /api/health  - Health check');
    console.log('='.repeat(60));
});

