import { prisma } from "../models/prisma";

type CreateAuditLogInput = {
  userId?: number;
  action: string;
  entity: string;
  entityId?: number;
  oldValues?: string;
  newValues?: string;
};

export const auditRepository = {
  create: (input: CreateAuditLogInput) => {
    const data = {
      action: input.action,
      entity: input.entity,
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      ...(input.entityId !== undefined ? { entityId: input.entityId } : {}),
      ...(input.oldValues !== undefined ? { oldValues: input.oldValues } : {}),
      ...(input.newValues !== undefined ? { newValues: input.newValues } : {}),
    };

    return prisma.auditLog.create({
      data,
      select: {
        id: true,
      },
    });
  },
};
