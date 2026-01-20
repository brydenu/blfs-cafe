import "dotenv/config";
import { PrismaClient } from '@prisma/client';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-db-connection.ts:7',message:'Script started',data:{hasDotEnv:typeof require !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion agent log

// #region agent log
const dbUrl = process.env.DATABASE_URL;
const dbUrlLength = dbUrl?.length || 0;
const dbUrlPrefix = dbUrl?.substring(0, 30) || 'MISSING';
fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-db-connection.ts:12',message:'DATABASE_URL check',data:{exists:!!dbUrl,length:dbUrlLength,prefix:dbUrlPrefix,hasPostgres:dbUrl?.includes('postgres'),hasSsl:dbUrl?.includes('sslmode'),hasRds:dbUrl?.includes('rds.amazonaws.com')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion agent log

async function testConnection() {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-db-connection.ts:18',message:'Creating PrismaClient',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion agent log
    
    const prisma = new PrismaClient();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-db-connection.ts:23',message:'Attempting connection',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion agent log
    
    // Test connection
    await prisma.$connect();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-db-connection.ts:30',message:'Connection successful',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion agent log
    
    const productCount = await prisma.product.count();
    console.log(`✅ Connection successful! Found ${productCount} products.`);
    
    await prisma.$disconnect();
  } catch (error: any) {
    // #region agent log
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'NO_CODE';
    const errorName = error?.name || 'Unknown';
    fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-db-connection.ts:40',message:'Connection failed',data:{errorName,errorCode,errorMessage:errorMessage.substring(0,200),hasCanReach:errorMessage.includes('Can\'t reach'),hasENOTFOUND:errorMessage.includes('ENOTFOUND'),hasETIMEDOUT:errorMessage.includes('ETIMEDOUT'),hasP1001:errorCode === 'P1001'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion agent log
    
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    process.exit(1);
  }
}

testConnection();
