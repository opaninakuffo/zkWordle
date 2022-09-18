-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "root" TEXT NOT NULL,
    "tree" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "playerAddress" TEXT NOT NULL,
    "guessesLeft" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in progress',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Contract" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_root_key" ON "Game"("root");

-- CreateIndex
CREATE UNIQUE INDEX "Game_identifier_key" ON "Game"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_name_key" ON "Contract"("name");
