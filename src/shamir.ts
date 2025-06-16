// Shamir's Secret Sharing implementation
// Using a smaller prime field for easier debugging
const PRIME = 65537; // A small prime > 12345

// Helper function to generate a random number in range [0, max)
function randomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

// Helper function for modular exponentiation
// This function performs modular exponentiation: calculates (base^exponent) % modulus efficiently
// It uses the square-and-multiply algorithm to reduce the number of multiplications needed
// For example: modPow(2, 5, 13) calculates (2^5) % 13 = 32 % 13 = 6
//
// The algorithm works by:
// 1. Converting the exponent to binary (e.g., 5 = 101 in binary)
// 2. Starting with result = 1, for each bit in the exponent:
//    - Square the current base (multiply it by itself)
//    - If the bit is 1, multiply result by the current base
// 3. Taking the modulus after each multiplication to keep numbers manageable
//
// We need to process the exponent bit by bit because:
// 1. Directly calculating large exponents (base^exponent) would result in extremely large numbers
//    that would overflow JavaScript's number limits
// 2. Taking the modulus only at the end wouldn't help because the intermediate values would still overflow
// 3. The bit-by-bit approach lets us keep all intermediate values within the modulus range
//    by applying the modulus operation after each multiplication
//
// For example, calculating 2^5 mod 13 step by step:
// 5 in binary is 101
// result = 1
// bit 1: result = (1 * 2) % 13 = 2
// bit 0: no multiplication (just square base)
// bit 1: result = (2 * 4) % 13 = 8 % 13 = 6
//
// This is critical for Shamir's Secret Sharing as it's used in polynomial evaluation
// while keeping all calculations within our finite field (defined by PRIME)
function modPow(base: number, exponent: number, modulus: number): number {
    if (modulus === 1) return 0;
    
    let result = 1;
    base = base % modulus;
    
    while (exponent > 0) {
        if (exponent % 2 === 1) {
            result = (result * base) % modulus;
        }
        base = (base * base) % modulus;
        exponent = Math.floor(exponent / 2);
    }
    
    return result;
}

// Extended Euclidean Algorithm for modular inverse
// This function calculates the modular multiplicative inverse of 'a' modulo 'm'
// using the Extended Euclidean Algorithm.
//
// The modular multiplicative inverse of 'a' (mod m) is a number b such that:
// (a * b) % m = 1
//
// For example, the modular inverse of 3 (mod 7) is 5 because:
// (3 * 5) % 7 = 15 % 7 = 1
//
// The algorithm works by:
// 1. First normalizing 'a' to be positive and within the modulus range
// 2. Using the Extended Euclidean Algorithm to find Bézout's identity coefficients
//    where: old_r = old_s * a + t * m (we don't track 't' as we don't need it)
// 3. If GCD (stored in old_r) isn't 1, then the inverse doesn't exist
// 4. Otherwise, old_s (or old_s % m) is our inverse
//
// This is crucial for Shamir's Secret Sharing during reconstruction:
// - When combining shares using Lagrange interpolation, we need to divide numbers
// - In modular arithmetic, we can't directly divide; instead we multiply by the inverse
// - So x/y (mod m) becomes x * modInverse(y, m) (mod m)
function modInverse(a: number, m: number): number {
    a = ((a % m) + m) % m;
    
    let [old_r, r] = [a, m];
    let [old_s, s] = [1, 0];
    
    while (r !== 0) {
        const quotient = Math.floor(old_r / r);
        [old_r, r] = [r, old_r - quotient * r];
        [old_s, s] = [s, old_s - quotient * s];
    }
    
    if (old_r !== 1) {
        throw new Error("Modular inverse does not exist");
    }
    
    return ((old_s % m) + m) % m;
}

// Evaluate polynomial at x
function evalPoly(coeffs: number[], x: number): number {
    let y = 0;
    for (let j = 0; j < coeffs.length; j++) {
        y = (y + coeffs[j] * modPow(x, j, PRIME)) % PRIME;
    }
    return y;
}

// Generate n shares from a secret, requiring k shares to reconstruct
export function generateShares(secret: number, n: number, k: number): number[][] {
    if (k > n) {
        throw new Error("k must be less than or equal to n");
    }
    if (secret >= PRIME) {
        throw new Error("Secret must be less than the prime field size");
    }

    // Generate random coefficients for the polynomial
    const coefficients: number[] = [secret];
    for (let i = 1; i < k; i++) {
        coefficients.push(randomInt(PRIME));
    }

    // Debug: print polynomial
    console.log('Polynomial coefficients:', coefficients);

    // Generate n points on the polynomial
    const shares: number[][] = [];
    for (let i = 1; i <= n; i++) {
        const y = evalPoly(coefficients, i);
        shares.push([i, y]);
    }

    return shares;
}

// Reconstruct the secret from k shares using Lagrange interpolation
// This function implements Lagrange interpolation to recover the original secret
// from a set of shares. Here's how it works:
//
// 1. For each share i:
//    - Calculate the Lagrange basis polynomial l_i(0)
//    - This polynomial equals 1 at x_i and 0 at all other x_j points
//    - Formula: l_i(x) = ∏(j≠i) (x - x_j)/(x_i - x_j)
//
// 2. The secret is reconstructed by:
//    - Multiplying each share's y-value by its Lagrange basis polynomial
//    - Summing all these products
//    - All calculations are done modulo PRIME to stay in the finite field
export function reconstructSecret(shares: number[][]): number {
    const k = shares.length;
    let secret = 0;

    for (let i = 0; i < k; i++) {
        let li = 1;
        // Calculate the Lagrange basis polynomial for share i
        for (let j = 0; j < k; j++) {
            if (i !== j) {
                const xi = shares[i][0];
                const xj = shares[j][0];
                // Calculate (0 - x_j)/(x_i - x_j) in the finite field
                li = (li * (PRIME - xj) % PRIME * modInverse((xi - xj + PRIME) % PRIME, PRIME)) % PRIME;
            }
        }
        // Multiply by the share's y-value and add to the sum
        secret = (secret + shares[i][1] * li) % PRIME;
    }
    // Ensure the result is in the range [0, PRIME-1]
    return (secret + PRIME) % PRIME;
} 