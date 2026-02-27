-- CreateEnum
CREATE TYPE "AgeCategory" AS ENUM ('PUPPY', 'ADULT', 'SENIOR');

-- CreateEnum
CREATE TYPE "SizeCategory" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "description" TEXT,
    "ageCategory" "AgeCategory" NOT NULL,
    "sizeCategory" "SizeCategory" NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "shelterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dog" ADD CONSTRAINT "Dog_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
