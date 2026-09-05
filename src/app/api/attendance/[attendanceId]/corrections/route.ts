import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { attendance, attendanceCorrections } from "@/db/schema";
import { requireAuth, requirePermission, AuthorizationError, getAuthSession, getCurrentEmployee } from "@/lib/auth/authorization";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const session = await getAuthSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attendanceId } = await params;
    const corrections = await db
      .select()
      .from(attendanceCorrections)
      .where(eq(attendanceCorrections.attendanceId, attendanceId))
      .orderBy(desc(attendanceCorrections.createdAt));

    return NextResponse.json({ data: corrections });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to fetch corrections" }, { status: errorStatus });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const session = await requireAuth(request.headers);
    const { attendanceId } = await params;
    const body = await request.json();

    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json({ error: "Correction reason is required" }, { status: 400 });
    }

    const [att] = await db.select().from(attendance).where(eq(attendance.id, attendanceId)).limit(1);
    if (!att) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    const [correction] = await db
      .insert(attendanceCorrections)
      .values({
        attendanceId,
        requestedBy: session.user.id,
        oldCheckIn: att.checkIn,
        oldCheckOut: att.checkOut,
        newCheckIn: body.newCheckIn ? new Date(body.newCheckIn) : null,
        newCheckOut: body.newCheckOut ? new Date(body.newCheckOut) : null,
        reason: body.reason.trim(),
        status: "pending",
      })
      .returning();

    return NextResponse.json({ data: correction, message: "Attendance correction requested" }, { status: 201 });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to submit correction request" }, { status: errorStatus });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const session = await requirePermission("attendance", "correct", request.headers);
    const { attendanceId } = await params;
    const body = await request.json();

    if (!body.correctionId || !["approved", "refused"].includes(body.status)) {
      return NextResponse.json({ error: "Valid correctionId and status ('approved' | 'refused') required" }, { status: 400 });
    }

    const [correction] = await db
      .select()
      .from(attendanceCorrections)
      .where(eq(attendanceCorrections.id, body.correctionId))
      .limit(1);

    if (!correction) {
      return NextResponse.json({ error: "Correction not found" }, { status: 404 });
    }

    if (correction.status !== "pending") {
      return NextResponse.json({ error: `Correction is already ${correction.status}` }, { status: 409 });
    }

    const result = await db.transaction(async (tx) => {
      const [updatedCorr] = await tx
        .update(attendanceCorrections)
        .set({
          status: body.status,
          approvedBy: session.user.id,
        })
        .where(eq(attendanceCorrections.id, body.correctionId))
        .returning();

      if (body.status === "approved") {
        const checkIn = updatedCorr.newCheckIn ? new Date(updatedCorr.newCheckIn) : null;
        const checkOut = updatedCorr.newCheckOut ? new Date(updatedCorr.newCheckOut) : null;

        let workedMinutes = 0;
        if (checkIn && checkOut) {
          workedMinutes = Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)));
        }
        const overtimeMinutes = workedMinutes > 480 ? workedMinutes - 480 : 0;

        await tx
          .update(attendance)
          .set({
            checkIn,
            checkOut,
            workedMinutes,
            overtimeMinutes,
            status: workedMinutes > 480 ? "overtime" : "present",
            isManuallyEdited: true,
            notes: `Correction approved: ${updatedCorr.reason}`,
            updatedAt: new Date(),
          })
          .where(eq(attendance.id, attendanceId));
      }

      return updatedCorr;
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    const errorStatus = error.status || (error instanceof AuthorizationError ? error.status : 500);
    return NextResponse.json({ error: error.message || "Failed to process correction" }, { status: errorStatus });
  }
}
