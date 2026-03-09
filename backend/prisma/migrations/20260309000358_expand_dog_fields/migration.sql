-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "adoptionFee" INTEGER,
ADD COLUMN     "goodWithDogs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "goodWithKids" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "houseTrained" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "microchipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "neutered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vaccinated" BOOLEAN NOT NULL DEFAULT false;
