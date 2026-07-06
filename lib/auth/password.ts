import { createHash, pbkdf2Sync, timingSafeEqual } from "crypto";

const PBKDF2_DIGEST = "sha256";
const PBKDF2_KEY_LENGTH = 32;

type ParsedPasswordHash =
  | {
      scheme: "pbkdf2";
      iterations: number;
      salt: string;
      hash: string;
    }
  | {
      scheme: "sha256";
      hash: string;
    };

function parsePasswordHash(passwordHash: string): ParsedPasswordHash | null {
  const [scheme, ...parts] = passwordHash.split(":");

  if (scheme === "pbkdf2" && parts.length === 3) {
    const [iterations, salt, hash] = parts;
    const parsedIterations = Number(iterations);

    if (!Number.isInteger(parsedIterations) || parsedIterations <= 0) {
      return null;
    }

    return {
      scheme,
      iterations: parsedIterations,
      salt,
      hash,
    };
  }

  if (scheme === "sha256" && parts.length === 1) {
    return {
      scheme,
      hash: parts[0],
    };
  }

  return null;
}

function safeCompareHex(leftHex: string, rightHex: string) {
  try {
    const left = Buffer.from(leftHex, "hex");
    const right = Buffer.from(rightHex, "hex");

    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function verifyPassword(password: string, passwordHash: string) {
  const parsed = parsePasswordHash(passwordHash);

  if (!parsed) {
    return false;
  }

  if (parsed.scheme === "sha256") {
    const hash = createHash("sha256").update(password).digest("hex");
    return safeCompareHex(hash, parsed.hash);
  }

  const hash = pbkdf2Sync(
    password,
    parsed.salt,
    parsed.iterations,
    PBKDF2_KEY_LENGTH,
    PBKDF2_DIGEST
  ).toString("hex");

  return safeCompareHex(hash, parsed.hash);
}
