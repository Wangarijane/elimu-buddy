import bcrypt from "bcryptjs";

// paste the hashed password from your DB here
const hashedPassword = "$2a$10$FEuY4BbZ4ndtXAdEvkdqO..6GxW8RHTlyQ6UHD78l7iZlh3YcVmqW"; 

// try different plain passwords here
const plainPasswords = ["Jane400", "jane400", "Jane123"];

async function testPasswords() {
  for (const plain of plainPasswords) {
    const match = await bcrypt.compare(plain, hashedPassword);
    console.log(`Password "${plain}" => ${match ? "✅ Match" : "❌ No match"}`);
  }
}

testPasswords();
