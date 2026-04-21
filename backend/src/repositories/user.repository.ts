import { Prisma, User, UserRole } from "@prisma/client";
import { prisma } from "../models/prisma";

type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
};

const userAuthSelect = {
  id: true,
  email: true,
  password: true,
  fullName: true,
  role: true,
  isActive: true,
} satisfies Prisma.UserSelect;

const userSessionSelect = {
  id: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

const userExistenceSelect = {
  id: true,
} satisfies Prisma.UserSelect;

export const userRepository = {
  findByEmail: (email: string) => {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: userAuthSelect,
    });
  },

  findByLoginIdentifier: (identifier: string) => {
    const normalized = identifier.trim();
    const normalizedEmail = normalized.toLowerCase();

    return prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { email: normalizedEmail },
          { phone: normalized },
          { fullName: { equals: normalized, mode: "insensitive" } },
        ],
      },
      select: userAuthSelect,
    });
  },

  findByEmailIncludingDeleted: (email: string) => {
    return prisma.user.findUnique({
      where: { email },
      select: userExistenceSelect,
    });
  },

  findById: (id: number) => {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSessionSelect,
    });
  },

  create: (input: CreateUserInput): Promise<User> => {
    return prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        fullName: input.fullName,
        role: input.role ?? UserRole.USER,
      },
    });
  },

  updatePassword: (id: number, password: string) => {
    return prisma.user.update({
      where: { id },
      data: { password },
    });
  },

  softDelete: (id: number) => {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  },
};
