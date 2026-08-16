import { getQuestionDetails } from './leetcode.js';
import { dbService } from './db.js';

// Curated catalog of standard, high-quality, free LeetCode problems across difficulties & topics
export const PROBLEM_CATALOG = [
  // Easy
  { frontendId: '1', title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy', topicTags: ['Array', 'Hash Table'] },
  { frontendId: '9', title: 'Palindrome Number', titleSlug: 'palindrome-number', difficulty: 'Easy', topicTags: ['Math'] },
  { frontendId: '13', title: 'Roman to Integer', titleSlug: 'roman-to-integer', difficulty: 'Easy', topicTags: ['Hash Table', 'Math', 'String'] },
  { frontendId: '14', title: 'Longest Common Prefix', titleSlug: 'longest-common-prefix', difficulty: 'Easy', topicTags: ['String', 'Trie'] },
  { frontendId: '20', title: 'Valid Parentheses', titleSlug: 'valid-parentheses', difficulty: 'Easy', topicTags: ['String', 'Stack'] },
  { frontendId: '21', title: 'Merge Two Sorted Lists', titleSlug: 'merge-two-sorted-lists', difficulty: 'Easy', topicTags: ['Linked List', 'Recursion'] },
  { frontendId: '26', title: 'Remove Duplicates from Sorted Array', titleSlug: 'remove-duplicates-from-sorted-array', difficulty: 'Easy', topicTags: ['Array', 'Two Pointers'] },
  { frontendId: '27', title: 'Remove Element', titleSlug: 'remove-element', difficulty: 'Easy', topicTags: ['Array', 'Two Pointers'] },
  { frontendId: '35', title: 'Search Insert Position', titleSlug: 'search-insert-position', difficulty: 'Easy', topicTags: ['Array', 'Binary Search'] },
  { frontendId: '58', title: 'Length of Last Word', titleSlug: 'length-of-last-word', difficulty: 'Easy', topicTags: ['String'] },
  { frontendId: '66', title: 'Plus One', titleSlug: 'plus-one', difficulty: 'Easy', topicTags: ['Array', 'Math'] },
  { frontendId: '67', title: 'Add Binary', titleSlug: 'add-binary', difficulty: 'Easy', topicTags: ['Math', 'String', 'Bit Manipulation'] },
  { frontendId: '70', title: 'Climbing Stairs', titleSlug: 'climbing-stairs', difficulty: 'Easy', topicTags: ['Dynamic Programming', 'Math'] },
  { frontendId: '88', title: 'Merge Sorted Array', titleSlug: 'merge-sorted-array', difficulty: 'Easy', topicTags: ['Array', 'Two Pointers', 'Sorting'] },
  { frontendId: '94', title: 'Binary Tree Inorder Traversal', titleSlug: 'binary-tree-inorder-traversal', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search', 'Stack'] },
  { frontendId: '100', title: 'Same Tree', titleSlug: 'same-tree', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search'] },
  { frontendId: '101', title: 'Symmetric Tree', titleSlug: 'symmetric-tree', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search'] },
  { frontendId: '104', title: 'Maximum Depth of Binary Tree', titleSlug: 'maximum-depth-of-binary-tree', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search'] },
  { frontendId: '121', title: 'Best Time to Buy and Sell Stock', titleSlug: 'best-time-to-buy-and-sell-stock', difficulty: 'Easy', topicTags: ['Array', 'Dynamic Programming'] },
  { frontendId: '125', title: 'Valid Palindrome', titleSlug: 'valid-palindrome', difficulty: 'Easy', topicTags: ['Two Pointers', 'String'] },
  { frontendId: '136', title: 'Single Number', titleSlug: 'single-number', difficulty: 'Easy', topicTags: ['Array', 'Bit Manipulation'] },
  { frontendId: '141', title: 'Linked List Cycle', titleSlug: 'linked-list-cycle', difficulty: 'Easy', topicTags: ['Hash Table', 'Linked List', 'Two Pointers'] },
  { frontendId: '169', title: 'Majority Element', titleSlug: 'majority-element', difficulty: 'Easy', topicTags: ['Array', 'Hash Table', 'Divide and Conquer', 'Sorting', 'Counting'] },
  { frontendId: '206', title: 'Reverse Linked List', titleSlug: 'reverse-linked-list', difficulty: 'Easy', topicTags: ['Linked List', 'Recursion'] },
  { frontendId: '217', title: 'Contains Duplicate', titleSlug: 'contains-duplicate', difficulty: 'Easy', topicTags: ['Array', 'Hash Table', 'Sorting'] },
  { frontendId: '226', title: 'Invert Binary Tree', titleSlug: 'invert-binary-tree', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search'] },
  { frontendId: '242', title: 'Valid Anagram', titleSlug: 'valid-anagram', difficulty: 'Easy', topicTags: ['Hash Table', 'String', 'Sorting'] },
  { frontendId: '268', title: 'Missing Number', titleSlug: 'missing-number', difficulty: 'Easy', topicTags: ['Array', 'Hash Table', 'Math', 'Bit Manipulation'] },
  { frontendId: '283', title: 'Move Zeroes', titleSlug: 'move-zeroes', difficulty: 'Easy', topicTags: ['Array', 'Two Pointers'] },
  { frontendId: '338', title: 'Counting Bits', titleSlug: 'counting-bits', difficulty: 'Easy', topicTags: ['Dynamic Programming', 'Bit Manipulation'] },
  { frontendId: '344', title: 'Reverse String', titleSlug: 'reverse-string', difficulty: 'Easy', topicTags: ['Two Pointers', 'String'] },
  { frontendId: '387', title: 'First Unique Character in a String', titleSlug: 'first-unique-character-in-a-string', difficulty: 'Easy', topicTags: ['Hash Table', 'String', 'Queue', 'Counting'] },
  { frontendId: '392', title: 'Is Subsequence', titleSlug: 'is-subsequence', difficulty: 'Easy', topicTags: ['Two Pointers', 'String', 'Dynamic Programming'] },
  { frontendId: '704', title: 'Binary Search', titleSlug: 'binary-search', difficulty: 'Easy', topicTags: ['Array', 'Binary Search'] },

  // Medium
  { frontendId: '2', title: 'Add Two Numbers', titleSlug: 'add-two-numbers', difficulty: 'Medium', topicTags: ['Linked List', 'Math', 'Recursion'] },
  { frontendId: '3', title: 'Longest Substring Without Repeating Characters', titleSlug: 'longest-substring-without-repeating-characters', difficulty: 'Medium', topicTags: ['Hash Table', 'String', 'Sliding Window'] },
  { frontendId: '5', title: 'Longest Palindromic Substring', titleSlug: 'longest-palindromic-substring', difficulty: 'Medium', topicTags: ['Two Pointers', 'String', 'Dynamic Programming'] },
  { frontendId: '11', title: 'Container With Most Water', titleSlug: 'container-with-most-water', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers', 'Greedy'] },
  { frontendId: '15', title: '3Sum', titleSlug: '3sum', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers', 'Sorting'] },
  { frontendId: '17', title: 'Letter Combinations of a Phone Number', titleSlug: 'letter-combinations-of-a-phone-number', difficulty: 'Medium', topicTags: ['Hash Table', 'String', 'Backtracking'] },
  { frontendId: '19', title: 'Remove Nth Node From End of List', titleSlug: 'remove-nth-node-from-end-of-list', difficulty: 'Medium', topicTags: ['Linked List', 'Two Pointers'] },
  { frontendId: '22', title: 'Generate Parentheses', titleSlug: 'generate-parentheses', difficulty: 'Medium', topicTags: ['String', 'Dynamic Programming', 'Backtracking'] },
  { frontendId: '33', title: 'Search in Rotated Sorted Array', titleSlug: 'search-in-rotated-sorted-array', difficulty: 'Medium', topicTags: ['Array', 'Binary Search'] },
  { frontendId: '34', title: 'Find First and Last Position of Element in Sorted Array', titleSlug: 'find-first-and-last-position-of-element-in-sorted-array', difficulty: 'Medium', topicTags: ['Array', 'Binary Search'] },
  { frontendId: '39', title: 'Combination Sum', titleSlug: 'combination-sum', difficulty: 'Medium', topicTags: ['Array', 'Backtracking'] },
  { frontendId: '46', title: 'Permutations', titleSlug: 'permutations', difficulty: 'Medium', topicTags: ['Array', 'Backtracking'] },
  { frontendId: '48', title: 'Rotate Image', titleSlug: 'rotate-image', difficulty: 'Medium', topicTags: ['Array', 'Math', 'Matrix'] },
  { frontendId: '49', title: 'Group Anagrams', titleSlug: 'group-anagrams', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'String', 'Sorting'] },
  { frontendId: '53', title: 'Maximum Subarray', titleSlug: 'maximum-subarray', difficulty: 'Medium', topicTags: ['Array', 'Divide and Conquer', 'Dynamic Programming'] },
  { frontendId: '55', title: 'Jump Game', titleSlug: 'jump-game', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Greedy'] },
  { frontendId: '56', title: 'Merge Intervals', titleSlug: 'merge-intervals', difficulty: 'Medium', topicTags: ['Array', 'Sorting'] },
  { frontendId: '62', title: 'Unique Paths', titleSlug: 'unique-paths', difficulty: 'Medium', topicTags: ['Math', 'Dynamic Programming', 'Combinatorics'] },
  { frontendId: '64', title: 'Minimum Path Sum', titleSlug: 'minimum-path-sum', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Matrix'] },
  { frontendId: '73', title: 'Set Matrix Zeroes', titleSlug: 'set-matrix-zeroes', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Matrix'] },
  { frontendId: '75', title: 'Sort Colors', titleSlug: 'sort-colors', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers', 'Sorting'] },
  { frontendId: '78', title: 'Subsets', titleSlug: 'subsets', difficulty: 'Medium', topicTags: ['Array', 'Backtracking', 'Bit Manipulation'] },
  { frontendId: '79', title: 'Word Search', titleSlug: 'word-search', difficulty: 'Medium', topicTags: ['Array', 'String', 'Backtracking', 'Matrix'] },
  { frontendId: '98', title: 'Validate Binary Search Tree', titleSlug: 'validate-binary-search-tree', difficulty: 'Medium', topicTags: ['Tree', 'Binary Search Tree', 'Binary Tree'] },
  { frontendId: '102', title: 'Binary Tree Level Order Traversal', titleSlug: 'binary-tree-level-order-traversal', difficulty: 'Medium', topicTags: ['Tree', 'Breadth-First Search', 'Binary Tree'] },
  { frontendId: '105', title: 'Construct Binary Tree from Preorder and Inorder Traversal', titleSlug: 'construct-binary-tree-from-preorder-and-inorder-traversal', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Divide and Conquer', 'Tree', 'Binary Tree'] },
  { frontendId: '128', title: 'Longest Consecutive Sequence', titleSlug: 'longest-consecutive-sequence', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Union Find'] },
  { frontendId: '139', title: 'Word Break', titleSlug: 'word-break', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'String', 'Dynamic Programming', 'Trie', 'Memoization'] },
  { frontendId: '143', title: 'Reorder List', titleSlug: 'reorder-list', difficulty: 'Medium', topicTags: ['Linked List', 'Two Pointers', 'Stack', 'Recursion'] },
  { frontendId: '150', title: 'Evaluate Reverse Polish Notation', titleSlug: 'evaluate-reverse-polish-notation', difficulty: 'Medium', topicTags: ['Array', 'Math', 'Stack'] },
  { frontendId: '152', title: 'Maximum Product Subarray', titleSlug: 'maximum-product-subarray', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming'] },
  { frontendId: '153', title: 'Find Minimum in Rotated Sorted Array', titleSlug: 'find-minimum-in-rotated-sorted-array', difficulty: 'Medium', topicTags: ['Array', 'Binary Search'] },
  { frontendId: '198', title: 'House Robber', titleSlug: 'house-robber', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming'] },
  { frontendId: '200', title: 'Number of Islands', titleSlug: 'number-of-islands', difficulty: 'Medium', topicTags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'] },
  { frontendId: '207', title: 'Course Schedule', titleSlug: 'course-schedule', difficulty: 'Medium', topicTags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'] },
  { frontendId: '208', title: 'Implement Trie (Prefix Tree)', titleSlug: 'implement-trie-prefix-tree', difficulty: 'Medium', topicTags: ['Hash Table', 'String', 'Design', 'Trie'] },
  { frontendId: '215', title: 'Kth Largest Element in an Array', titleSlug: 'kth-largest-element-in-an-array', difficulty: 'Medium', topicTags: ['Array', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'] },
  { frontendId: '230', title: 'Kth Smallest Element in a BST', titleSlug: 'kth-smallest-element-in-a-bst', difficulty: 'Medium', topicTags: ['Tree', 'Binary Search Tree', 'Binary Tree'] },
  { frontendId: '238', title: 'Product of Array Except Self', titleSlug: 'product-of-array-except-self', difficulty: 'Medium', topicTags: ['Array', 'Prefix Sum'] },
  { frontendId: '300', title: 'Longest Increasing Subsequence', titleSlug: 'longest-increasing-subsequence', difficulty: 'Medium', topicTags: ['Array', 'Binary Search', 'Dynamic Programming'] },
  { frontendId: '322', title: 'Coin Change', titleSlug: 'coin-change', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Breadth-First Search'] },
  { frontendId: '347', title: 'Top K Frequent Elements', titleSlug: 'top-k-frequent-elements', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Bucket Sort', 'Counting', 'Quickselect'] },
  { frontendId: '416', title: 'Partition Equal Subset Sum', titleSlug: 'partition-equal-subset-sum', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming'] },
  { frontendId: '424', title: 'Longest Repeating Character Replacement', titleSlug: 'longest-repeating-character-replacement', difficulty: 'Medium', topicTags: ['Hash Table', 'String', 'Sliding Window'] },
  { frontendId: '435', title: 'Non-overlapping Intervals', titleSlug: 'non-overlapping-intervals', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Greedy', 'Sorting'] },
  { frontendId: '560', title: 'Subarray Sum Equals K', titleSlug: 'subarray-sum-equals-k', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Prefix Sum'] },
  { frontendId: '647', title: 'Palindromic Substrings', titleSlug: 'palindromic-substrings', difficulty: 'Medium', topicTags: ['Two Pointers', 'String', 'Dynamic Programming'] },
  { frontendId: '739', title: 'Daily Temperatures', titleSlug: 'daily-temperatures', difficulty: 'Medium', topicTags: ['Array', 'Stack', 'Monotonic Stack'] },
  { frontendId: '973', title: 'K Closest Points to Origin', titleSlug: 'k-closest-points-to-origin', difficulty: 'Medium', topicTags: ['Array', 'Math', 'Divide and Conquer', 'Geometry', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'] },
  { frontendId: '981', title: 'Time Based Key-Value Store', titleSlug: 'time-based-key-value-store', difficulty: 'Medium', topicTags: ['Hash Table', 'String', 'Binary Search', 'Design'] },
  { frontendId: '994', title: 'Rotting Oranges', titleSlug: 'rotting-oranges', difficulty: 'Medium', topicTags: ['Array', 'Breadth-First Search', 'Matrix'] },
  { frontendId: '1143', title: 'Longest Common Subsequence', titleSlug: 'longest-common-subsequence', difficulty: 'Medium', topicTags: ['String', 'Dynamic Programming'] },

  // Hard
  { frontendId: '4', title: 'Median of Two Sorted Arrays', titleSlug: 'median-of-two-sorted-arrays', difficulty: 'Hard', topicTags: ['Array', 'Binary Search', 'Divide and Conquer'] },
  { frontendId: '10', title: 'Regular Expression Matching', titleSlug: 'regular-expression-matching', difficulty: 'Hard', topicTags: ['String', 'Dynamic Programming', 'Recursion'] },
  { frontendId: '23', title: 'Merge k Sorted Lists', titleSlug: 'merge-k-sorted-lists', difficulty: 'Hard', topicTags: ['Linked List', 'Divide and Conquer', 'Heap (Priority Queue)', 'Merge Sort'] },
  { frontendId: '42', title: 'Trapping Rain Water', titleSlug: 'trapping-rain-water', difficulty: 'Hard', topicTags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'] },
  { frontendId: '76', title: 'Minimum Window Substring', titleSlug: 'minimum-window-substring', difficulty: 'Hard', topicTags: ['Hash Table', 'String', 'Sliding Window'] },
  { frontendId: '84', title: 'Largest Rectangle in Histogram', titleSlug: 'largest-rectangle-in-histogram', difficulty: 'Hard', topicTags: ['Array', 'Stack', 'Monotonic Stack'] },
  { frontendId: '124', title: 'Binary Tree Maximum Path Sum', titleSlug: 'binary-tree-maximum-path-sum', difficulty: 'Hard', topicTags: ['Dynamic Programming', 'Tree', 'Depth-First Search', 'Binary Tree'] },
  { frontendId: '224', title: 'Basic Calculator', titleSlug: 'basic-calculator', difficulty: 'Hard', topicTags: ['Math', 'String', 'Stack', 'Recursion'] },
  { frontendId: '239', title: 'Sliding Window Maximum', titleSlug: 'sliding-window-maximum', difficulty: 'Hard', topicTags: ['Array', 'Queue', 'Sliding Window', 'Heap (Priority Queue)', 'Monotonic Queue'] },
  { frontendId: '295', title: 'Find Median from Data Stream', titleSlug: 'find-median-from-data-stream', difficulty: 'Hard', topicTags: ['Two Pointers', 'Design', 'Sorting', 'Heap (Priority Queue)', 'Data Stream'] },
  { frontendId: '297', title: 'Serialize and Deserialize Binary Tree', titleSlug: 'serialize-and-deserialize-binary-tree', difficulty: 'Hard', topicTags: ['String', 'Tree', 'Depth-First Search', 'Breadth-First Search', 'Design', 'Binary Tree'] }
];

/**
 * Search local catalog and enrich with season usage state
 */
export function searchCatalog({ query = '', difficulty = '', topic = '', seasonId = null, limit = 50 }) {
  const cleanQuery = query.trim().toLowerCase();
  const usedSlugs = seasonId ? new Set(dbService.getSeasonUsedProblems(seasonId)) : new Set();

  let results = PROBLEM_CATALOG.filter(p => {
    // Difficulty filter
    if (difficulty && p.difficulty.toLowerCase() !== difficulty.toLowerCase()) {
      return false;
    }

    // Topic filter
    if (topic && !p.topicTags.some(t => t.toLowerCase() === topic.toLowerCase())) {
      return false;
    }

    // Query filter (matches frontendId, title, or slug)
    if (cleanQuery) {
      const matchId = p.frontendId.toLowerCase().includes(cleanQuery);
      const matchTitle = p.title.toLowerCase().includes(cleanQuery);
      const matchSlug = p.titleSlug.toLowerCase().includes(cleanQuery);
      const matchTopic = p.topicTags.some(t => t.toLowerCase().includes(cleanQuery));
      if (!matchId && !matchTitle && !matchSlug && !matchTopic) {
        return false;
      }
    }

    return true;
  });

  // Enrich with usedInSeason
  return results.slice(0, limit).map(p => ({
    ...p,
    usedInSeason: usedSlugs.has(p.titleSlug)
  }));
}

/**
 * Resolve a problem by URL, titleSlug, or frontend ID
 * Checks local catalog first, falls back to live LeetCode GraphQL
 */
export async function resolveProblem(input, seasonId = null) {
  if (!input) return null;
  let clean = input.trim();

  // Handle full LeetCode URL e.g. https://leetcode.com/problems/two-sum/
  const urlMatch = clean.match(/leetcode\.com\/problems\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) {
    clean = urlMatch[1];
  }

  const usedSlugs = seasonId ? new Set(dbService.getSeasonUsedProblems(seasonId)) : new Set();

  // Try local catalog match
  const localMatch = PROBLEM_CATALOG.find(
    p => p.titleSlug.toLowerCase() === clean.toLowerCase() || p.frontendId === clean
  );

  if (localMatch) {
    return {
      ...localMatch,
      usedInSeason: usedSlugs.has(localMatch.titleSlug)
    };
  }

  // Fallback to LeetCode live GraphQL query
  try {
    const live = await getQuestionDetails(clean);
    if (live) {
      return {
        ...live,
        usedInSeason: usedSlugs.has(live.titleSlug)
      };
    }
  } catch (err) {
    console.error('Failed to resolve live problem:', err.message);
  }

  return null;
}

/**
 * Generate random balanced problem set with season deduplication
 */
export function generateRandomProblemSet({
  countEasy = 1,
  countMedium = 2,
  countHard = 1,
  topic = '',
  seasonId = null
}) {
  const usedSlugs = seasonId ? new Set(dbService.getSeasonUsedProblems(seasonId)) : new Set();

  // Filter available candidate pool (excluding problems already used in this season!)
  const availablePool = PROBLEM_CATALOG.filter(p => !usedSlugs.has(p.titleSlug));

  // Filter by topic if specified
  const pool = topic
    ? availablePool.filter(p => p.topicTags.some(t => t.toLowerCase() === topic.toLowerCase()))
    : availablePool;

  const easyPool = pool.filter(p => p.difficulty === 'Easy');
  const mediumPool = pool.filter(p => p.difficulty === 'Medium');
  const hardPool = pool.filter(p => p.difficulty === 'Hard');

  // Shuffle helper
  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  const selectedEasy = shuffle(easyPool).slice(0, Number(countEasy) || 0);
  const selectedMedium = shuffle(mediumPool).slice(0, Number(countMedium) || 0);
  const selectedHard = shuffle(hardPool).slice(0, Number(countHard) || 0);

  const selected = [...selectedEasy, ...selectedMedium, ...selectedHard];

  return {
    problems: selected.map((p, index) => ({
      ...p,
      points: (index + 1) * 100,
      usedInSeason: false
    })),
    poolStats: {
      totalAvailableInPool: availablePool.length,
      excludedSeasonProblemsCount: usedSlugs.size
    }
  };
}
