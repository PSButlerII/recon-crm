import crypto from "node:crypto";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Password: ", (password) => {
  const iterations = 310000;
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, 32, "sha256")
    .toString("hex");

  console.log();
  console.log("CRM_AUTH_PASSWORD_HASH=");
  console.log(`pbkdf2:${iterations}:${salt}:${hash}`);

  rl.close();
});