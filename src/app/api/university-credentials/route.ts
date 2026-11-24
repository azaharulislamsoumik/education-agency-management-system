
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const REQUIRED_FIELDS = [
  "full_name",
  "passport_number",
  "date_of_birth",
  "gender",
  "nationality",
  "country_code",
  "place_of_birth",
  "date_of_issue",
  "date_of_expiry",
] as const;

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cloudUrl = process.env.CLOUD_OCR_API_URL;
  const cloudKey = process.env.CLOUD_OCR_API_KEY;

  if (!url || !anon || !cloudUrl || !cloudKey) {
    throw new Error("Passport OCR server configuration is incomplete.");
  }

  return { url, anon, cloudUrl, cloudKey };
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

export async function POST(request: NextRequest) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const { cloudUrl, cloudKey } = getConfig();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a passport image." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be between 1 byte and 10 MB." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP and PDF files are supported." },
        { status: 400 }
      );
    }

    const cloudForm = new FormData();
    cloudForm.append("file", file, file.name);

    const response = await fetch(cloudUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cloudKey}`,
      },
      body: cloudForm,
      signal: AbortSignal.timeout(50000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Cloud OCR failed:", response.status);

      return NextResponse.json(
        { error: "Cloud OCR service could not process the passport." },
        { status: 502 }
      );
    }

    const result = await response.json();
    const source = result.data ?? result;

    const passport = Object.fromEntries(
      REQUIRED_FIELDS.map((field) => [
        field,
        typeof source[field] === "string"
          ? source[field].trim()
          : "",
      ])
    );

    return NextResponse.json(
      {
        success: true,
        passport,
        review_required: result.review_required ?? false,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Passport OCR API error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Passport scanning failed. Please try again." },
      { status: 500 }
    );
  }
}
