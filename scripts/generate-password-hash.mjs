#!/usr/bin/env node
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DEFAULT_ITERATIONS = 310_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

async function readPassword() {
  const [, , providedPassword] = process.argv;

  if (providedPassword) {
    return providedPassword;
  }

  const readline = createInterface({ input, output });
  const password = await readline.question("CRM owner password: ");
  readline.close();

  return password;
}

const password = await readPassword();

if (!password) {
  console.error("Password is required.");
  process.exit(1);
}

const iterations = Number(process.env.CRM_AUTH_PBKDF2_ITERATIONS) || DEFAULT_ITERATIONS;
const salt = randomBytes(16).toString("hex");
const hash = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString("hex");

console.log(`pbkdf2:${iterations}:${salt}:${hash}`);
