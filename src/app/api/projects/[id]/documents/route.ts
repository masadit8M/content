import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage/local";
import { logAuditTrail } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");
    const isOutput = searchParams.get("isOutput");

    const whereClause: any = {
      projectId: params.id,
    };

    if (folder) whereClause.folder = folder;
    if (isOutput === "true") whereClause.isConsultingOutput = true;

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        category: true,
        versions: {
          include: { uploadedBy: true },
          orderBy: { versionNumber: "desc" },
        },
        relatedActivity: true,
        relatedTask: true,
        relatedRec: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") as string | null;
    const title = formData.get("title") as string | null;
    const folder = (formData.get("folder") as string) || "SOP";
    const categoryId = formData.get("categoryId") as string | null;
    const changeNotes = formData.get("changeNotes") as string | null;
    const isConsultingOutput = formData.get("isConsultingOutput") === "true";
    const outputStatus = formData.get("outputStatus") as string | null;

    let targetDocumentId = documentId;
    let versionNum = 1;

    let uploadedPath = "/uploads/mock-sample.pdf";
    let originalName = "Dokumen_Konsultasi.pdf";
    let fileSize = 102400;

    if (file && typeof file !== "string") {
      const buffer = Buffer.from(await file.arrayBuffer());
      originalName = file.name;
      const uploadRes = await storageService.uploadFile(buffer, originalName, {
        projectId: params.id,
        folder: folder.toLowerCase(),
      });
      uploadedPath = uploadRes.filePath;
      fileSize = uploadRes.fileSize;
    }

    if (targetDocumentId) {
      // Adding a new revision / version to existing document
      const existingDoc = await prisma.document.findUnique({
        where: { id: targetDocumentId },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      });

      if (!existingDoc) {
        return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
      }

      versionNum = (existingDoc.versions[0]?.versionNumber || 1) + 1;

      await prisma.documentVersion.create({
        data: {
          documentId: existingDoc.id,
          versionNumber: versionNum,
          fileName: originalName,
          filePath: uploadedPath,
          fileSize,
          uploadedById: user.id,
          changeNotes: changeNotes || `Revisi versi ${versionNum}`,
        },
      });

      await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          updatedAt: new Date(),
          outputStatus: outputStatus || existingDoc.outputStatus,
        },
      });

      await logAuditTrail({
        projectId: params.id,
        userId: user.id,
        action: "UPLOAD_VERSION",
        entityType: "DOCUMENT",
        entityId: existingDoc.id,
        description: `${user.name} mengunggah versi baru v${versionNum} untuk dokumen "${existingDoc.title}"`,
      });

      return NextResponse.json({ success: true, documentId: existingDoc.id, versionNumber: versionNum });
    } else {
      // Creating a new document record
      if (!title) {
        return NextResponse.json({ error: "Judul dokumen wajib diisi" }, { status: 400 });
      }

      const count = await prisma.document.count({ where: { projectId: params.id } });
      const docCode = `DOC-${folder.substring(0, 3)}-${String(count + 1).padStart(3, "0")}`;

      const newDoc = await prisma.document.create({
        data: {
          docCode,
          projectId: params.id,
          title,
          folder,
          categoryId: categoryId || null,
          status: "DRAFT",
          isConsultingOutput,
          outputStatus: isConsultingOutput ? outputStatus || "DELIVERED" : null,
          versions: {
            create: {
              versionNumber: 1,
              fileName: originalName,
              filePath: uploadedPath,
              fileSize,
              uploadedById: user.id,
              changeNotes: changeNotes || "Dokumen versi awal",
            },
          },
        },
        include: { versions: true },
      });

      await logAuditTrail({
        projectId: params.id,
        userId: user.id,
        action: "CREATE",
        entityType: "DOCUMENT",
        entityId: newDoc.id,
        description: `${user.name} membuat dokumen baru [${docCode}] "${title}" (Folder: ${folder})`,
      });

      return NextResponse.json({ success: true, document: newDoc });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
