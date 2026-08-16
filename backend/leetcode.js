const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

/**
 * Fetch questions from a LeetCode Public Problem List (e.g. https://leetcode.com/problem-list/a0b4xdj1/)
 * @param {string} listSlug - The list identifier (e.g. 'a0b4xdj1' or 'top-interview-questions')
 */
async function getQuestionsFromList(listSlug) {
  if (!listSlug) return [];
  const cleanSlug = listSlug.replace(/^.*problem-list\//, '').replace(/\/.*$/, '').trim();

  const query = `
    query favoriteQuestionList($favoriteSlug: String!) {
      favoriteQuestionList(favoriteSlug: $favoriteSlug) {
        questions {
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
        }
        totalLength
      }
    }
  `;

  try {
    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify({
        query,
        variables: { favoriteSlug: cleanSlug }
      })
    });

    const data = await res.json();
    const rawQuestions = data.data?.favoriteQuestionList?.questions || [];

    return rawQuestions.map(q => {
      const diff = q.difficulty ? (q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1).toLowerCase()) : 'Medium';
      return {
        frontendId: String(q.questionFrontendId || ''),
        title: q.title,
        titleSlug: q.titleSlug,
        difficulty: diff,
        topicTags: (q.topicTags || []).map(t => t.name)
      };
    });
  } catch (err) {
    console.error(`Error fetching LeetCode list ${cleanSlug}:`, err.message);
    return [];
  }
}

/**
 * Fetch detailed problem info by titleSlug from LeetCode public GraphQL
 * @param {string} titleSlug - Problem slug (e.g. 'two-sum')
 */
async function getQuestionDetails(titleSlug) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags {
          name
          slug
        }
      }
    }
  `;

  try {
    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug }
      })
    });

    const data = await res.json();
    const question = data.data?.question;
    if (!question) return null;

    return {
      frontendId: question.questionFrontendId,
      title: question.title,
      titleSlug: question.titleSlug,
      difficulty: question.difficulty,
      topicTags: (question.topicTags || []).map(t => t.name)
    };
  } catch (err) {
    console.error(`Error fetching LeetCode question ${titleSlug}:`, err.message);
    return null;
  }
}

/**
 * Fetch recent accepted submissions for a given username
 * @param {string} username - LeetCode username
 * @param {number} limit - Number of submissions to fetch (default 20)
 */
async function getRecentAcSubmissions(username, limit = 20) {
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

  try {
    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify({
        query,
        variables: {
          username: username.trim(),
          limit
        }
      })
    });

    const data = await res.json();
    return data.data?.recentAcSubmissionList || [];
  } catch (err) {
    console.error(`Error fetching AC submissions for ${username}:`, err.message);
    return [];
  }
}

/**
 * Verify if a user has solved a specific problem during an active contest
 */
async function verifyUserSubmission(username, problemSlug, contestStartTime, contestEndTime) {
  if (!contestStartTime || Number(contestStartTime) <= 0) {
    return {
      verified: false,
      reason: 'The contest has not started yet. Submissions can only be verified after the match starts.'
    };
  }

  const submissions = await getRecentAcSubmissions(username, 25);
  const targetSlug = problemSlug.toLowerCase().trim();

  const matchedSubmissions = submissions.filter(
    sub => sub.titleSlug.toLowerCase().trim() === targetSlug
  );

  if (matchedSubmissions.length === 0) {
    return {
      verified: false,
      reason: `No accepted submission found on LeetCode for @${username} on "${problemSlug}".`
    };
  }

  const startWindow = Number(contestStartTime);
  const endWindow = contestEndTime ? (Number(contestEndTime) + 30) : Infinity;

  const validSubmission = matchedSubmissions.find(sub => {
    const subTime = Number(sub.timestamp);
    return subTime >= startWindow && subTime <= endWindow;
  });

  if (!validSubmission) {
    const latestSub = matchedSubmissions[0];
    const subDate = new Date(latestSub.timestamp * 1000).toLocaleString();
    const startDate = new Date(startWindow * 1000).toLocaleTimeString();
    
    if (Number(latestSub.timestamp) < startWindow) {
      return {
        verified: false,
        reason: `Found a previous AC solution on LeetCode from ${subDate}, but it was submitted before this contest started (Match began at ${startDate}). Please solve and re-submit the problem on LeetCode during the active match window.`
      };
    }

    return {
      verified: false,
      reason: `Found an AC submission on LeetCode at ${subDate}, but it was submitted after the contest ended.`
    };
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
}

module.exports = {
  getQuestionDetails,
  getQuestionsFromList,
  getRecentAcSubmissions,
  verifyUserSubmission
};
