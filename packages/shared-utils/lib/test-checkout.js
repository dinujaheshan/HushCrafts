"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTests = runTests;
const http = __importStar(require("http"));
const PROJECT_ID = 'hush-craft-workspace';
const REGION = 'us-central1';
const BASE_URL = `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}/api/api/v1`;
function makeRequest(method, path, payload) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${path}`);
        const data = JSON.stringify(payload);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                }
                catch (err) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', (err) => reject(err));
        req.write(data);
        req.end();
    });
}
async function runTests() {
    console.log('Starting API checkout validation integration tests...');
    // Test case 1: Test valid checkout submission
    const validPayload = {
        customerDetails: {
            fullName: 'Niluni Perera',
            mobileNumber: '0777123456',
            email: 'niluni@gmail.com'
        },
        shippingAddress: {
            addressLine1: 'No. 12, Galle Road',
            addressLine2: 'Colombo 03',
            city: 'Colombo',
            district: 'Colombo',
            postalCode: '00300'
        },
        items: [
            {
                productId: 'prod_velvet_cloud',
                variantId: 'v_vc_beige_38',
                sku: 'HC-VC-BG-38',
                quantity: 2
            }
        ],
        couponCode: 'WELCOME10',
        notes: 'Please call before delivering.'
    };
    console.log('\n[Test 1] Posting valid checkout request...');
    try {
        const res1 = await makeRequest('POST', '/orders', validPayload);
        console.log('Response status:', res1.status);
        console.log('Response payload:', JSON.stringify(res1.data, null, 2));
        if (res1.status === 201 && res1.data.success) {
            console.log('✓ Success: Order created successfully!');
        }
        else {
            console.log('✗ Failed: Could not create order. (Make sure emulator functions are running)');
        }
    }
    catch (err) {
        console.error('Error contacting emulator endpoint:', err.message);
        console.log('Note: To run this test, launch: "npm run emulators" first.');
        return;
    }
    // Test case 2: Test invalid field constraints (e.g. bad mobile number)
    const invalidPayload = {
        customerDetails: {
            fullName: 'Nil', // Too short
            mobileNumber: '12345', // Invalid mobile format
            email: 'bad-email'
        },
        shippingAddress: {
            addressLine1: 'No. 5',
            addressLine2: null,
            city: 'Col',
            district: 'InvalidDistrict', // Non-matching district enum
            postalCode: '900' // Bad length
        },
        items: [], // Empty cart
    };
    console.log('\n[Test 2] Posting invalid checkout request...');
    const res2 = await makeRequest('POST', '/orders', invalidPayload);
    console.log('Response status:', res2.status);
    console.log('Response validation payload:', JSON.stringify(res2.data, null, 2));
    if (res2.status === 400 && !res2.data.success) {
        console.log('✓ Success: Properly rejected bad input formats!');
    }
    else {
        console.log('✗ Failed: Expected validation reject but got:', res2.status);
    }
}
if (require.main === module) {
    runTests().catch(console.error);
}
//# sourceMappingURL=test-checkout.js.map