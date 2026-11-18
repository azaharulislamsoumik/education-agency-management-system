
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.UNIVERSITY_CREDENTIALS_ENCRYPTION_KEY;

  if (!url || !anon || !service || !secret) {
    throw new Error("Server configuration is incomplete.");
  }

  const key = Buffer.from(secret, "base64");

  if (key.length !== 32) {
    throw new Error("Invalid encryption key. A 32-byte key is required.");
  }

  return { url, anon, service, key };
}

async function authorize(request: NextRequest) {
  const { url, anon } = getConfig();
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const token = authorization.slice(7);

  const authClient = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await authClient.auth.getUser(token);

  return !error && !!data.user;
}

// SAVE ENCRYPTED PASSWORD
export async function POST(request: NextRequest) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const { key, url, service } = getConfig();
    const body = await request.json();

    if (
      typeof body.universityId !== "string" ||
      typeof body.password !== "string" ||
      body.password.length === 0 ||
      body.password.length > 1024
    ) {
      return NextResponse.json(
        { error: "Invalid university ID or password." },
        { status: 400 }
      );
    }

    const iv = randomBytes(12);

    const cipher = createCipheriv(
      "aes-256-gcm",
      key,
      iv
    );

    const encrypted = Buffer.concat([
      cipher.update(body.password, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const admin = createClient(url, service, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await admin
      .from("universities")
      .update({
        password_encrypted: encrypted.toString("base64"),
        password_iv: iv.toString("base64"),
        password_auth_tag: authTag.toString("base64"),
      })
      .eq("id", body.universityId)
      .select("id");

    if (error) {
      console.error("Password save database error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "University not found. Password was not saved." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password saved successfully.",
    });
  } catch (error) {
    console.error("Password save error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save password.",
      },
      { status: 500 }
    );
  }
}

// GET AND DECRYPT PASSWORD
export async function GET(request: NextRequest) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const { key, url, service } = getConfig();

    const universityId =
      request.nextUrl.searchParams.get("universityId");

    if (!universityId) {
      return NextResponse.json(
        { error: "University ID is required." },
        { status: 400 }
      );
    }

    const admin = createClient(url, service, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await admin
      .from("universities")
      .select(
        "password_encrypted, password_iv, password_auth_tag"
      )
      .eq("id", universityId)
      .maybeSingle();

    if (error) {
      console.error("Password read database error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (
      !data ||
      !data.password_encrypted ||
      !data.password_iv ||
      !data.password_auth_tag
    ) {
      return NextResponse.json(
        { error: "No password saved for this university." },
        { status: 404 }
      );
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(data.password_iv, "base64")
    );

    decipher.setAuthTag(
      Buffer.from(data.password_auth_tag, "base64")
    );

    const decrypted = Buffer.concat([
      decipher.update(
        Buffer.from(data.password_encrypted, "base64")
      ),
      decipher.final(),
    ]);

    return NextResponse.json({
      password: decrypted.toString("utf8"),
    });
  } catch (error) {
    console.error("Password reveal error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not reveal password.",
      },
      { status: 500 }
    );
  }
}
