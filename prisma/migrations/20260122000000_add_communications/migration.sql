-- CreateTable
CREATE TABLE "Communication" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "visibilityLocations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationDismissal" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "communicationId" INTEGER NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationDismissal_userId_communicationId_key" ON "CommunicationDismissal"("userId", "communicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationDismissal_sessionId_communicationId_key" ON "CommunicationDismissal"("sessionId", "communicationId");

-- AddForeignKey
ALTER TABLE "CommunicationDismissal" ADD CONSTRAINT "CommunicationDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationDismissal" ADD CONSTRAINT "CommunicationDismissal_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
