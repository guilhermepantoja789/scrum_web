-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "typeId" TEXT;

-- CreateTable
CREATE TABLE "public"."TaskType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "TaskType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskType_name_key" ON "public"."TaskType"("name");

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."TaskType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
