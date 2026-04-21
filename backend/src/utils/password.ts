import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = (plainPassword: string) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

export const comparePassword = (plainPassword: string, hashedPassword: string) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
