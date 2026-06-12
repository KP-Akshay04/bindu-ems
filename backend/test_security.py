from app.utils.security import hash_password

password = "admin123"

hashed = hash_password(password)

print("Original:", password)
print("Hashed:", hashed)