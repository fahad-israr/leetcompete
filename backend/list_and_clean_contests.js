const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function cleanTrashContests() {
  console.log('=== Inspecting DynamoDB Contests Table ===\n');

  const res = await docClient.send(new ScanCommand({ TableName: 'leetcompete-contests-dev' }));
  const items = res.Items || [];
  console.log(`Found ${items.length} contests in DynamoDB:`);

  const now = Math.floor(Date.now() / 1000);
  let deletedCount = 0;

  for (const c of items) {
    const isOldTest = c.title?.toLowerCase().includes('test') || 
                      c.title?.toLowerCase().includes('hijack') ||
                      c.hostUsername?.toLowerCase().includes('test') ||
                      c.hostUsername?.toLowerCase().includes('alice_') ||
                      c.hostUsername?.toLowerCase().includes('bob_') ||
                      (c.status === 'FINISHED') ||
                      (c.endTime && now > c.endTime) ||
                      (c.status === 'WAITING' && (now - (c.createdAt || now)) > 86400);

    console.log(`- [${c.code}] "${c.title}" | Host: @${c.hostUsername} | Status: ${c.status} | Delete: ${isOldTest}`);

    if (isOldTest) {
      await docClient.send(new DeleteCommand({
        TableName: 'leetcompete-contests-dev',
        Key: { id: c.id }
      }));
      deletedCount++;
    }
  }

  console.log(`\n🧹 Cleaned up ${deletedCount} obsolete/test contests! ${items.length - deletedCount} remaining.`);
}

cleanTrashContests().catch(console.error);
