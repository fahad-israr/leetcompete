/**
 * LeetCode Public GraphQL Integration for AWS Lambda
 * Queries LeetCode's public GraphQL API for problem metadata & recent user submissions
 */

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

async function queryLeetCode(query, variables = {}) {
  try {
    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
      throw new Error(`LeetCode GraphQL responded with status ${res.status}`);
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Error querying LeetCode GraphQL:', error.message);
    throw error;
  }
}

async function getRecentAcceptedSubmissions(username, limit = 20) {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  const data = await queryLeetCode(query, { username: username.trim(), limit });
  return data?.recentAcSubmissionList || [];
}

async function getQuestionDetails(titleSlug) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        isPaidOnly
        topicTags {
          name
          slug
        }
      }
    }
  `;

  const data = await queryLeetCode(query, { titleSlug: titleSlug.trim().toLowerCase() });
  const q = data?.question;
  if (!q) return null;

  return {
    frontendId: q.questionFrontendId,
    title: q.title,
    titleSlug: q.titleSlug,
    difficulty: q.difficulty,
    isPaidOnly: q.isPaidOnly,
    topicTags: (q.topicTags || []).map(t => t.name)
  };
}

async function verifyUserSubmission(username, problemSlug, contestStartTime, contestEndTime) {
  if (!username || !problemSlug) {
    return {
      verified: false,
      reason: 'Username and problem slug are required for verification.'
    };
  }

  try {
    const submissions = await getRecentAcceptedSubmissions(username, 20);

    if (!submissions || submissions.length === 0) {
      return {
        verified: false,
        reason: `No recent accepted submissions found on LeetCode for @${username}. Please submit your solution on LeetCode first!`
      };
    }

    const normalizedSlug = problemSlug.trim().toLowerCase();
    const now = Math.floor(Date.now() / 1000);
    const start = contestStartTime || 0;
    const end = contestEndTime || (now + 3600);

    const matchingSubs = submissions.filter(s => s.titleSlug.toLowerCase() === normalizedSlug);

    if (matchingSubs.length === 0) {
      return {
        verified: false,
        reason: `No Accepted submission for "${problemSlug}" found in the last ${submissions.length} submissions of @${username}. Submit your solution on LeetCode first!`
      };
    }

    // Check if submission timestamp is within the contest window (with 60s clock skew buffer)
    const validSubmission = matchingSubs.find(s => {
      const ts = Number(s.timestamp);
      return ts >= (start - 60) && ts <= (end + 60);
    });

    if (!validSubmission) {
      const latestTs = Number(matchingSubs[0].timestamp);
      const subDate = new Date(latestTs * 1000).toLocaleTimeString();
      const startDate = new Date(start * 1000).toLocaleTimeString();

      if (latestTs < start) {
        return {
          verified: false,
          reason: `Submission found at ${subDate}, but the contest started at ${startDate}. Only solutions submitted AFTER contest start are accepted!`
        };
      } else {
        return {
          verified: false,
          reason: `Submission found at ${subDate}, but it falls outside the contest timeframe.`
        };
      }
    }

    return {
      verified: true,
      submission: {
        id: validSubmission.id,
        title: validSubmission.title,
        titleSlug: validSubmission.titleSlug,
        timestamp: Number(validSubmission.timestamp)
      }
    };
  } catch (error) {
    return {
      verified: false,
      reason: `Failed to query LeetCode: ${error.message}`
    };
  }
}

module.exports = {
  getRecentAcceptedSubmissions,
  getQuestionDetails,
  verifyUserSubmission
};
