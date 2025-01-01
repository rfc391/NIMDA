
import json
from cryptography.fernet import Fernet

# Key management can be integrated into secure vaults in production
ENCRYPTION_KEY = Fernet.generate_key()
fernet = Fernet(ENCRYPTION_KEY)

def secure_serialize(data):
    """Compactly serialize the given data structure and encrypt it."""
    serialized_data = json.dumps(data).encode('utf-8')
    encrypted_data = fernet.encrypt(serialized_data)
    return encrypted_data

def secure_deserialize(encrypted_data):
    """Decrypt and deserialize the compactly stored data."""
    decrypted_data = fernet.decrypt(encrypted_data)
    deserialized_data = json.loads(decrypted_data.decode('utf-8'))
    return deserialized_data
    