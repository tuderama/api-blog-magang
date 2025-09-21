/*
  Warnings:

  - Added the required column `imagePath` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Post` ADD COLUMN `imagePath` VARCHAR(512) NOT NULL;
