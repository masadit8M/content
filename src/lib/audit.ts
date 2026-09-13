import { prisma } from "./prisma";

export interface LogAuditOptions {
  projectId?: string;
  userId: string;
  action: string; // "CREATE", "UPDATE", "STATUS_CHANGE", "CLIENT_DECISION", "COST_APPROVAL", "UPLOAD_VERSION", "FINALIZE"
  entityType: string; // "TASK", "RECOMMENDATION", "ISSUE", "SDM", "DOCUMENT", "ACTIVITY", "REPORT", "PROJECT"
  entityId: string;
  description: string;
  changes?: Record<string, { old: any; new: any }> | any;
}

export async function logAuditTrail(options: LogAuditOptions) {
  try {
    return await prisma.auditLog.create({
      data: {
        projectId: options.projectId,
        userId: options.userId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        description: options.description,
        changesJson: options.changes ? JSON.stringify(options.changes) : null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export async function createNotification(params: {
  userId: string;
  projectId?: string;
  title: string;
  message: string;
  linkUrl?: string;
  type?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        projectId: params.projectId,
        title: params.title,
        message: params.message,
        linkUrl: params.linkUrl,
        type: params.type || "GENERAL",
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
