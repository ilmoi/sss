import { generateShares, reconstructSecret } from './shamir';

// Example usage of Shamir's Secret Sharing
function demonstrateShamirSecretSharing() {
    // Original secret
    const secret = 1234;
    console.log('Original secret:', secret);

    // Generate 5 shares, requiring 3 shares to reconstruct
    const n = 5; // total number of shares
    const k = 3; // threshold (minimum shares needed to reconstruct)
    
    try {
        // Generate shares
        const shares = generateShares(secret, n, k);
        console.log('\nGenerated shares:');
        shares.forEach((share, index) => {
            console.log(`Share ${index + 1}: (${share[0]}, ${share[1]})`);
        });

        // Reconstruct using first k shares
        const reconstructionShares = shares.slice(0, k);
        const reconstructedSecret = reconstructSecret(reconstructionShares);
        console.log('\nReconstructed secret:', reconstructedSecret);
        console.log('Reconstruction successful:', reconstructedSecret === secret);
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

// Run the demonstration
demonstrateShamirSecretSharing(); 