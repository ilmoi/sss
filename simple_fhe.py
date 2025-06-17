import random
import math

"""
Key Generation Simplification
The _generate_secret_key() and _generate_public_key() methods are extremely simplified. In a real FHE system:
The secret key would be generated using a proper LWE (Learning With Errors) or RLWE (Ring-LWE) distribution
The public key would be derived from the secret key using proper cryptographic operations
The current implementation just generates random binary vectors, which is not cryptographically secure

Encryption Simplification
The encrypt() method has several major simplifications:
It uses a very small modulus q = 8 (real FHE systems use much larger moduli, often 2^32 or larger)
The noise is set to 0 (noise = 0), which completely breaks security. Real FHE systems add carefully controlled random noise
The encryption process is deterministic (same input always gives same output), which is a security vulnerability
The message encoding is very simple (just multiplying by a scale factor)

Decryption Simplification
The decrypt() method is oversimplified:
It uses a simple dot product with the secret key
Real FHE systems use more complex decryption procedures that handle noise properly
The current implementation might fail if there's any noise in the ciphertext

Homomorphic Operations
The add() and multiply() methods are simplified:
They perform basic modular arithmetic without proper noise management
Real FHE systems need to carefully manage noise growth during operations
The multiplication is particularly simplified, using a basic binary multiplication trick
Real FHE systems use more sophisticated techniques like relinearization and bootstrapping

Security Parameters
The implementation uses a tiny key size (8 bits in the demo)
Real FHE systems use much larger parameters (typically 1024 bits or more)
The modulus q is too small to provide any meaningful security

Missing Critical Components
No bootstrapping (a crucial operation in real FHE to manage noise)
No relinearization (needed for proper multiplication)
No proper noise sampling from appropriate distributions
No proper security parameter selection
No proper error handling for noise overflow

"""

class SimpleFHE:
    def __init__(self, key_size=1024, seed=42):
        """
        Initialize the FHE system with a key size.
        For simplicity, we'll use a basic implementation based on the Learning With Errors (LWE) problem.
        """
        self.key_size = key_size
        self.q = 8  # Modulus for encryption
        self.scale = self.q // 2  # Scale factor for message encoding
        self.seed = seed
        random.seed(seed)  # Set seed for reproducibility
        self.secret_key = self._generate_secret_key()
        self.public_key = self._generate_public_key()
        
    def _generate_secret_key(self):
        """Generate a secret key (a binary vector)"""
        key = [random.randint(0, 1) for _ in range(self.key_size)]
        print(f"Secret key: {key}")
        return key
    
    def _generate_public_key(self):
        """Generate a public key based on the secret key"""
        # In a real implementation, this would be more complex
        # Here we're using a simplified version for demonstration
        key = [random.randint(0, 1) for _ in range(self.key_size)]
        print(f"Public key: {key}")
        return key
    
    def encrypt(self, message):
        """
        Encrypt a single bit (0 or 1)
        Returns a ciphertext
        """
        if message not in [0, 1]:
            raise ValueError("Message must be a single bit (0 or 1)")
            
        # Use deterministic noise based on the message
        # In a real implementation, this would be random
        noise = 0  # For testing, we'll use no noise
        
        # Create ciphertext
        ciphertext = []
        for i in range(self.key_size):
            # Add noise to make the encryption secure
            value = (self.public_key[i] + noise) % self.q
            ciphertext.append(value)
        print(f"Ciphertext: {ciphertext}")
            
        # Add the message to the last position
        # We use scale to make the message more distinct from the noise
        ciphertext.append((message * self.scale + noise) % self.q)
        print(f"Ciphertext with message: {ciphertext}")
        
        return ciphertext
    
    def decrypt(self, ciphertext):
        """
        Decrypt a ciphertext back to a single bit
        """
        # Remove the last element which contains the message
        message_part = ciphertext[-1]
        ciphertext = ciphertext[:-1]
        
        # Compute the dot product with the secret key
        dot_product = sum(a * b for a, b in zip(ciphertext, self.secret_key))
        print(f"Ciphertext: {ciphertext}")
        print(f"Secret key: {self.secret_key}")
        print(f"Dot product: {dot_product}")
        
        # Decrypt the message
        # Since we multiplied by scale during encryption, we need to divide by scale here
        decrypted = ((message_part - dot_product) % self.q) // self.scale
        return decrypted
    
    def add(self, ciphertext1, ciphertext2):
        """
        Homomorphically add two ciphertexts
        """
        if len(ciphertext1) != len(ciphertext2):
            raise ValueError("Ciphertexts must be the same length")
            
        # Add the ciphertexts element-wise
        result = []
        for a, b in zip(ciphertext1[:-1], ciphertext2[:-1]):
            result.append((a + b) % self.q)
        
        # Add the message parts
        msg1 = ciphertext1[-1]
        msg2 = ciphertext2[-1]
        result.append((msg1 + msg2) % self.q)
        
        return result
    
    def multiply(self, ciphertext1, ciphertext2):
        """
        Homomorphically multiply two ciphertexts
        For binary multiplication, we use the fact that a * b = (a + b - (a + b) % 2) / 2
        """
        if len(ciphertext1) != len(ciphertext2):
            raise ValueError("Ciphertexts must be the same length")
            
        # Create a new ciphertext for the result
        result = []
        
        # For each element in the ciphertexts
        for a, b in zip(ciphertext1[:-1], ciphertext2[:-1]):
            result.append((a * b) % self.q)
        
        # Handle the message parts specially
        msg1 = ciphertext1[-1]
        msg2 = ciphertext2[-1]
        
        # For binary multiplication, we need to:
        # 1. Convert back to binary (divide by scale)
        # 2. Multiply the binary values
        # 3. Scale back up
        b1 = msg1 // self.scale
        b2 = msg2 // self.scale
        result_msg = (b1 * b2 * self.scale) % self.q
        result.append(result_msg)
        
        return result

def demonstrate_fhe():
    """Demonstrate the FHE operations"""
    # Create an instance of our FHE system
    fhe = SimpleFHE(key_size=8)  # Using a small key size for demonstration
    
    # Test cases
    test_cases = [(0, 0), (0, 1), (1, 0), (1, 1)]
    
    for bit1, bit2 in test_cases:
        print(f"\nTesting with bits: {bit1}, {bit2}")
        
        # Encrypt the bits
        ciphertext1 = fhe.encrypt(bit1)
        ciphertext2 = fhe.encrypt(bit2)
        
        print(f"Encrypted bit1: {ciphertext1}")
        print(f"Encrypted bit2: {ciphertext2}")
        
        # Perform homomorphic addition
        sum_ciphertext = fhe.add(ciphertext1, ciphertext2)
        decrypted_sum = fhe.decrypt(sum_ciphertext)
        print(f"Homomorphic addition result: {decrypted_sum} (expected: {(bit1 + bit2) % 2})")
        
        # Perform homomorphic multiplication
        product_ciphertext = fhe.multiply(ciphertext1, ciphertext2)
        decrypted_product = fhe.decrypt(product_ciphertext)
        print(f"Homomorphic multiplication result: {decrypted_product} (expected: {bit1 * bit2})")

if __name__ == "__main__":
    demonstrate_fhe() 
    
    