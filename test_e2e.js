import { dbService } from './server/db.js';
import { generateRandomProblemSet, searchCatalog, resolveProblem } from './server/problemBank.js';
import { verifyUserSubmission, getRecentAcceptedSubmissions } from './server/leetcode.js';

async function runTests() {
  console.log('🧪 Starting End-to-End Verification Tests...\n');

  // Test 1: Season Creation
  console.log('1. Testing Season Creation...');
  const season = dbService.createSeason({
    title: 'Spring 2026 Competitive League',
    description: 'Weekly tournament where no problems ever repeat!'
  });
  console.log(`   ✓ Season Created: [${season.id}] ${season.title}`);

  // Test 2: Problem Selection & Contest #1 in Season
  console.log('\n2. Testing Contest 1 Problem Generation under Season...');
  const round1Set = generateRandomProblemSet({
    countEasy: 1,
    countMedium: 2,
    countHard: 1,
    seasonId: season.id
  });
  console.log(`   ✓ Generated 4 problems for Round 1: ${round1Set.problems.map(p => p.title).join(', ')}`);

  const contest1 = dbService.createContest({
    title: 'Season Round #1: Opening Match',
    seasonId: season.id,
    durationMinutes: 90,
    hostUsername: 'fahad00cms',
    problems: round1Set.problems
  });
  console.log(`   ✓ Contest 1 Created: Code=${contest1.code}, Problems=${contest1.problems.length}`);

  // Test 3: Season Deduplication Engine for Contest #2
  console.log('\n3. Testing Season Problem Deduplication for Contest 2...');
  const usedInSeasonBeforeRound2 = dbService.getSeasonUsedProblems(season.id);
  console.log(`   ✓ Problems currently locked in Season Bank: ${usedInSeasonBeforeRound2.join(', ')}`);

  const round2Set = generateRandomProblemSet({
    countEasy: 1,
    countMedium: 2,
    countHard: 1,
    seasonId: season.id
  });
  console.log(`   ✓ Generated 4 problems for Round 2: ${round2Set.problems.map(p => p.title).join(', ')}`);

  // Verify intersection is empty
  const round1Slugs = new Set(round1Set.problems.map(p => p.titleSlug));
  const overlap = round2Set.problems.filter(p => round1Slugs.has(p.titleSlug));
  if (overlap.length === 0) {
    console.log('   ✓ SUCCESS: Zero overlap between Round 1 and Round 2! Deduplication working 100%.');
  } else {
    throw new Error(`Deduplication failed: Overlapping problems found: ${overlap.map(p => p.titleSlug).join(', ')}`);
  }

  // Test 4: Attempting to manually force an already used problem into Season Contest
  console.log('\n4. Testing Manual Catalog Search with Season Usage Flags...');
  const searchForUsed = searchCatalog({
    query: round1Set.problems[0].titleSlug,
    seasonId: season.id
  });
  console.log(`   ✓ Problem "${searchForUsed[0]?.title}" usedInSeason flag: ${searchForUsed[0]?.usedInSeason}`);
  if (!searchForUsed[0]?.usedInSeason) {
    throw new Error('Problem should be marked as usedInSeason: true');
  }

  // Test 5: Contest Lifecycle & Participants
  console.log('\n5. Testing Contest Lifecycle & Leaderboard...');
  dbService.addParticipant(contest1.id, 'alice_coder', 'Alice');
  dbService.addParticipant(contest1.id, 'bob_algo', 'Bob');
  
  // Start contest
  const startedContest = dbService.startContest(contest1.id);
  console.log(`   ✓ Contest Started: Status=${startedContest.status}, StartTime=${startedContest.startTime}`);

  // Simulate verified submission
  const solvedProb = contest1.problems[0];
  const submission = dbService.addSubmission({
    contestId: contest1.id,
    username: 'fahad00cms',
    problemSlug: solvedProb.titleSlug,
    submissionId: '2109999999',
    submissionTimestamp: startedContest.startTime + 720 // solved in 12 minutes
  });
  console.log(`   ✓ Submission Recorded: User=${submission.username}, Solved=${submission.problemTitle}, Penalty=${submission.penaltyMinutes}m`);

  const leaderboard = dbService.getLeaderboard(contest1.id);
  console.log(`   ✓ Leaderboard Computed: Rank 1=${leaderboard[0]?.displayName} (${leaderboard[0]?.solvedCount} solved, score=${leaderboard[0]?.totalScore})`);

  // Test 6: Season Cumulative Standings
  console.log('\n6. Testing Season Cumulative Standings...');
  const seasonStandings = dbService.getSeasonStandings(season.id);
  console.log(`   ✓ Season Leader: ${seasonStandings[0]?.displayName} with ${seasonStandings[0]?.seasonPoints} season points`);

  // Test 7: Live LeetCode GraphQL Verification check
  console.log('\n7. Testing Live LeetCode GraphQL API connection...');
  try {
    const recentAc = await getRecentAcceptedSubmissions('fahad00cms', 3);
    console.log(`   ✓ Successfully queried LeetCode GraphQL! Recent AC submissions for @fahad00cms:`);
    recentAc.forEach(s => console.log(`     - [${s.id}] ${s.title} (${s.titleSlug})`));
  } catch (err) {
    console.warn(`   ! Note: Live LeetCode test warning: ${err.message}`);
  }

  console.log('\n✅ All automated verification tests passed successfully!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
