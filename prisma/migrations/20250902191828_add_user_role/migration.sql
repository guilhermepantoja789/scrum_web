-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('admin', 'member', 'guest');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'member';
