/*
  Warnings:

  - The primary key for the `Post` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `Post` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(255) NOT NULL,
    ADD PRIMARY KEY (`id`);
