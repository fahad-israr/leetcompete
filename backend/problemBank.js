const { getQuestionDetails, getQuestionsFromList } = require('./leetcode');

// Curated Top Interview & Essential Standard Problem Catalog (150+ Standard LeetCode Problems)
const PROBLEM_CATALOG = [
  // Easy
  { frontendId: '1', title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy', topicTags: ['Array', 'Hash Table'] },
  { frontendId: '9', title: 'Palindrome Number', titleSlug: 'palindrome-number', difficulty: 'Easy', topicTags: ['Math'] },
  { frontendId: '13', title: 'Roman to Integer', titleSlug: 'roman-to-integer', difficulty: 'Easy', topicTags: ['Hash Table', 'Math', 'String'] },
  { frontendId: '14', title: 'Longest Common Prefix', titleSlug: 'longest-common-prefix', difficulty: 'Easy', topicTags: ['String', 'Trie'] },
  { frontendId: '20', title: 'Valid Parentheses', titleSlug: 'valid-parentheses', difficulty: 'Easy', topicTags: ['String', 'Stack'] },
  { frontendId: '21', title: 'Merge Two Sorted Lists', titleSlug: 'merge-two-sorted-lists', difficulty: 'Easy', topicTags: ['Linked List', 'Recursion'] },
  { frontendId: '26', title: 'Remove Duplicates from Sorted Array', titleSlug: 'remove-duplicates-from-sorted-array', difficulty: 'Easy', topicTags: ['Array', 'Two Pointers'] },
  { frontendId: '27', title: 'Remove Element', titleSlug: 'remove-element', difficulty: 'Easy', topicTags: ['Array', 'Two Pointers'] },
  { frontendId: '28', title: 'Find the Index of the First Occurrence in a String', titleSlug: 'find-the-index-of-the-first-occurrence-in-a-string', difficulty: 'Easy', topicTags: ['Two Pointers', 'String'] },
  { frontendId: '35', title: 'Search Insert Position', titleSlug: 'search-insert-position', difficulty: 'Easy', topicTags: ['Array', 'Binary Search'] },
  { frontendId: '58', title: 'Length of Last Word', titleSlug: 'length-of-last-word', difficulty: 'Easy', topicTags: ['String'] },
  { frontendId: '66', title: 'Plus One', titleSlug: 'plus-one', difficulty: 'Easy', topicTags: ['Array', 'Math'] },
  { frontendId: '67', title: 'Add Binary', titleSlug: 'add-binary', difficulty: 'Easy', topicTags: ['Math', 'String', 'Bit Manipulation'] },
  { frontendId: '69', title: 'Sqrt(x)', titleSlug: 'sqrtx', difficulty: 'Easy', topicTags: ['Math', 'Binary Search'] },
  { frontendId: '70', title: 'Climbing Stairs', titleSlug: 'climbing-stairs', difficulty: 'Easy', topicTags: ['Dynamic Programming', 'Math'] },
  { frontendId: '83', title: 'Remove Duplicates from Sorted List', titleSlug: 'remove-duplicates-from-sorted-list', difficulty: 'Easy', topicTags: ['Linked List'] },
  { frontendId: '88', title: 'Merge Sorted Array', titleSlug: 'merge-sorted-array', difficulty: 'Easy', topicTags: ['Array', 'Two Pointers', 'Sorting'] },
  { frontendId: '94', title: 'Binary Tree Inorder Traversal', titleSlug: 'binary-tree-inorder-traversal', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search', 'Stack'] },
  { frontendId: '100', title: 'Same Tree', titleSlug: 'same-tree', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search'] },
  { frontendId: '101', title: 'Symmetric Tree', titleSlug: 'symmetric-tree', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search'] },
  { frontendId: '104', title: 'Maximum Depth of Binary Tree', titleSlug: 'maximum-depth-of-binary-tree', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search'] },
  { frontendId: '108', title: 'Convert Sorted Array to Binary Search Tree', titleSlug: 'convert-sorted-array-to-binary-search-tree', difficulty: 'Easy', topicTags: ['Array', 'Divide and Conquer', 'Tree', 'Binary Search Tree'] },
  { frontendId: '112', title: 'Path Sum', titleSlug: 'path-sum', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search'] },
  { frontendId: '121', title: 'Best Time to Buy and Sell Stock', titleSlug: 'best-time-to-buy-and-sell-stock', difficulty: 'Easy', topicTags: ['Array', 'Dynamic Programming'] },
  { frontendId: '125', title: 'Valid Palindrome', titleSlug: 'valid-palindrome', difficulty: 'Easy', topicTags: ['Two Pointers', 'String'] },
  { frontendId: '136', title: 'Single Number', titleSlug: 'single-number', difficulty: 'Easy', topicTags: ['Array', 'Bit Manipulation'] },
  { frontendId: '141', title: 'Linked List Cycle', titleSlug: 'linked-list-cycle', difficulty: 'Easy', topicTags: ['Hash Table', 'Linked List', 'Two Pointers'] },
  { frontendId: '169', title: 'Majority Element', titleSlug: 'majority-element', difficulty: 'Easy', topicTags: ['Array', 'Hash Table', 'Divide and Conquer', 'Sorting', 'Counting'] },
  { frontendId: '190', title: 'Reverse Bits', titleSlug: 'reverse-bits', difficulty: 'Easy', topicTags: ['Divide and Conquer', 'Bit Manipulation'] },
  { frontendId: '191', title: 'Number of 1 Bits', titleSlug: 'number-of-1-bits', difficulty: 'Easy', topicTags: ['Divide and Conquer', 'Bit Manipulation'] },
  { frontendId: '202', title: 'Happy Number', titleSlug: 'happy-number', difficulty: 'Easy', topicTags: ['Hash Table', 'Math', 'Two Pointers'] },
  { frontendId: '205', title: 'Isomorphic Strings', titleSlug: 'isomorphic-strings', difficulty: 'Easy', topicTags: ['Hash Table', 'String'] },
  { frontendId: '206', title: 'Reverse Linked List', titleSlug: 'reverse-linked-list', difficulty: 'Easy', topicTags: ['Linked List', 'Recursion'] },
  { frontendId: '217', title: 'Contains Duplicate', titleSlug: 'contains-duplicate', difficulty: 'Easy', topicTags: ['Array', 'Hash Table', 'Sorting'] },
  { frontendId: '226', title: 'Invert Binary Tree', titleSlug: 'invert-binary-tree', difficulty: 'Easy', topicTags: ['Tree', 'Binary Tree', 'Depth-First Search'] },
  { frontendId: '228', title: 'Summary Ranges', titleSlug: 'summary-ranges', difficulty: 'Easy', topicTags: ['Array'] },
  { frontendId: '242', title: 'Valid Anagram', titleSlug: 'valid-anagram', difficulty: 'Easy', topicTags: ['Hash Table', 'String', 'Sorting'] },
  { frontendId: '268', title: 'Missing Number', titleSlug: 'missing-number', difficulty: 'Easy', topicTags: ['Array', 'Hash Table', 'Math', 'Bit Manipulation'] },
  { frontendId: '283', title: 'Move Zeroes', titleSlug: 'move-zeroes', difficulty: 'Easy', topicTags: ['Array', 'Two Pointers'] },
  { frontendId: '338', title: 'Counting Bits', titleSlug: 'counting-bits', difficulty: 'Easy', topicTags: ['Dynamic Programming', 'Bit Manipulation'] },
  { frontendId: '344', title: 'Reverse String', titleSlug: 'reverse-string', difficulty: 'Easy', topicTags: ['Two Pointers', 'String'] },
  { frontendId: '383', title: 'Ransom Note', titleSlug: 'ransom-note', difficulty: 'Easy', topicTags: ['Hash Table', 'String', 'Counting'] },
  { frontendId: '387', title: 'First Unique Character in a String', titleSlug: 'first-unique-character-in-a-string', difficulty: 'Easy', topicTags: ['Hash Table', 'String', 'Queue', 'Counting'] },
  { frontendId: '392', title: 'Is Subsequence', titleSlug: 'is-subsequence', difficulty: 'Easy', topicTags: ['Two Pointers', 'String', 'Dynamic Programming'] },
  { frontendId: '704', title: 'Binary Search', titleSlug: 'binary-search', difficulty: 'Easy', topicTags: ['Array', 'Binary Search'] },

  // Medium
  { frontendId: '2', title: 'Add Two Numbers', titleSlug: 'add-two-numbers', difficulty: 'Medium', topicTags: ['Linked List', 'Math', 'Recursion'] },
  { frontendId: '3', title: 'Longest Substring Without Repeating Characters', titleSlug: 'longest-substring-without-repeating-characters', difficulty: 'Medium', topicTags: ['Hash Table', 'String', 'Sliding Window'] },
  { frontendId: '5', title: 'Longest Palindromic Substring', titleSlug: 'longest-palindromic-substring', difficulty: 'Medium', topicTags: ['Two Pointers', 'String', 'Dynamic Programming'] },
  { frontendId: '6', title: 'Zigzag Conversion', titleSlug: 'zigzag-conversion', difficulty: 'Medium', topicTags: ['String'] },
  { frontendId: '11', title: 'Container With Most Water', titleSlug: 'container-with-most-water', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers', 'Greedy'] },
  { frontendId: '12', title: 'Integer to Roman', titleSlug: 'integer-to-roman', difficulty: 'Medium', topicTags: ['Hash Table', 'Math', 'String'] },
  { frontendId: '15', title: '3Sum', titleSlug: '3sum', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers', 'Sorting'] },
  { frontendId: '17', title: 'Letter Combinations of a Phone Number', titleSlug: 'letter-combinations-of-a-phone-number', difficulty: 'Medium', topicTags: ['Hash Table', 'String', 'Backtracking'] },
  { frontendId: '19', title: 'Remove Nth Node From End of List', titleSlug: 'remove-nth-node-from-end-of-list', difficulty: 'Medium', topicTags: ['Linked List', 'Two Pointers'] },
  { frontendId: '22', title: 'Generate Parentheses', titleSlug: 'generate-parentheses', difficulty: 'Medium', topicTags: ['String', 'Dynamic Programming', 'Backtracking'] },
  { frontendId: '33', title: 'Search in Rotated Sorted Array', titleSlug: 'search-in-rotated-sorted-array', difficulty: 'Medium', topicTags: ['Array', 'Binary Search'] },
  { frontendId: '34', title: 'Find First and Last Position of Element in Sorted Array', titleSlug: 'find-first-and-last-position-of-element-in-sorted-array', difficulty: 'Medium', topicTags: ['Array', 'Binary Search'] },
  { frontendId: '36', title: 'Valid Sudoku', titleSlug: 'valid-sudoku', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Matrix'] },
  { frontendId: '39', title: 'Combination Sum', titleSlug: 'combination-sum', difficulty: 'Medium', topicTags: ['Array', 'Backtracking'] },
  { frontendId: '45', title: 'Jump Game II', titleSlug: 'jump-game-ii', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Greedy'] },
  { frontendId: '46', title: 'Permutations', titleSlug: 'permutations', difficulty: 'Medium', topicTags: ['Array', 'Backtracking'] },
  { frontendId: '48', title: 'Rotate Image', titleSlug: 'rotate-image', difficulty: 'Medium', topicTags: ['Array', 'Math', 'Matrix'] },
  { frontendId: '49', title: 'Group Anagrams', titleSlug: 'group-anagrams', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'String', 'Sorting'] },
  { frontendId: '53', title: 'Maximum Subarray', titleSlug: 'maximum-subarray', difficulty: 'Medium', topicTags: ['Array', 'Divide and Conquer', 'Dynamic Programming'] },
  { frontendId: '54', title: 'Spiral Matrix', titleSlug: 'spiral-matrix', difficulty: 'Medium', topicTags: ['Array', 'Matrix', 'Simulation'] },
  { frontendId: '55', title: 'Jump Game', titleSlug: 'jump-game', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Greedy'] },
  { frontendId: '56', title: 'Merge Intervals', titleSlug: 'merge-intervals', difficulty: 'Medium', topicTags: ['Array', 'Sorting'] },
  { frontendId: '57', title: 'Insert Interval', titleSlug: 'insert-interval', difficulty: 'Medium', topicTags: ['Array'] },
  { frontendId: '62', title: 'Unique Paths', titleSlug: 'unique-paths', difficulty: 'Medium', topicTags: ['Math', 'Dynamic Programming', 'Combinatorics'] },
  { frontendId: '64', title: 'Minimum Path Sum', titleSlug: 'minimum-path-sum', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Matrix'] },
  { frontendId: '71', title: 'Simplify Path', titleSlug: 'simplify-path', difficulty: 'Medium', topicTags: ['String', 'Stack'] },
  { frontendId: '73', title: 'Set Matrix Zeroes', titleSlug: 'set-matrix-zeroes', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Matrix'] },
  { frontendId: '74', title: 'Search a 2D Matrix', titleSlug: 'search-a-2d-matrix', difficulty: 'Medium', topicTags: ['Array', 'Binary Search', 'Matrix'] },
  { frontendId: '75', title: 'Sort Colors', titleSlug: 'sort-colors', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers', 'Sorting'] },
  { frontendId: '77', title: 'Combinations', titleSlug: 'combinations', difficulty: 'Medium', topicTags: ['Backtracking'] },
  { frontendId: '78', title: 'Subsets', titleSlug: 'subsets', difficulty: 'Medium', topicTags: ['Array', 'Backtracking', 'Bit Manipulation'] },
  { frontendId: '79', title: 'Word Search', titleSlug: 'word-search', difficulty: 'Medium', topicTags: ['Array', 'String', 'Backtracking', 'Matrix'] },
  { frontendId: '80', title: 'Remove Duplicates from Sorted Array II', titleSlug: 'remove-duplicates-from-sorted-array-ii', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers'] },
  { frontendId: '82', title: 'Remove Duplicates from Sorted List II', titleSlug: 'remove-duplicates-from-sorted-list-ii', difficulty: 'Medium', topicTags: ['Linked List', 'Two Pointers'] },
  { frontendId: '86', title: 'Partition List', titleSlug: 'partition-list', difficulty: 'Medium', topicTags: ['Linked List', 'Two Pointers'] },
  { frontendId: '92', title: 'Reverse Linked List II', titleSlug: 'reverse-linked-list-ii', difficulty: 'Medium', topicTags: ['Linked List'] },
  { frontendId: '98', title: 'Validate Binary Search Tree', titleSlug: 'validate-binary-search-tree', difficulty: 'Medium', topicTags: ['Tree', 'Binary Search Tree', 'Binary Tree'] },
  { frontendId: '102', title: 'Binary Tree Level Order Traversal', titleSlug: 'binary-tree-level-order-traversal', difficulty: 'Medium', topicTags: ['Tree', 'Breadth-First Search', 'Binary Tree'] },
  { frontendId: '103', title: 'Binary Tree Zigzag Level Order Traversal', titleSlug: 'binary-tree-zigzag-level-order-traversal', difficulty: 'Medium', topicTags: ['Tree', 'Breadth-First Search', 'Binary Tree'] },
  { frontendId: '105', title: 'Construct Binary Tree from Preorder and Inorder Traversal', titleSlug: 'construct-binary-tree-from-preorder-and-inorder-traversal', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Divide and Conquer', 'Tree', 'Binary Tree'] },
  { frontendId: '106', title: 'Construct Binary Tree from Inorder and Postorder Traversal', titleSlug: 'construct-binary-tree-from-inorder-and-postorder-traversal', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Divide and Conquer', 'Tree', 'Binary Tree'] },
  { frontendId: '114', title: 'Flatten Binary Tree to Linked List', titleSlug: 'flatten-binary-tree-to-linked-list', difficulty: 'Medium', topicTags: ['Linked List', 'Stack', 'Tree', 'Depth-First Search', 'Binary Tree'] },
  { frontendId: '117', title: 'Populating Next Right Pointers in Each Node II', titleSlug: 'populating-next-right-pointers-in-each-node-ii', difficulty: 'Medium', topicTags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'] },
  { frontendId: '120', title: 'Triangle', titleSlug: 'triangle', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming'] },
  { frontendId: '122', title: 'Best Time to Buy and Sell Stock II', titleSlug: 'best-time-to-buy-and-sell-stock-ii', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Greedy'] },
  { frontendId: '128', title: 'Longest Consecutive Sequence', titleSlug: 'longest-consecutive-sequence', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Union Find'] },
  { frontendId: '129', title: 'Sum Root to Leaf Numbers', titleSlug: 'sum-root-to-leaf-numbers', difficulty: 'Medium', topicTags: ['Tree', 'Depth-First Search', 'Binary Tree'] },
  { frontendId: '130', title: 'Surrounded Regions', titleSlug: 'surrounded-regions', difficulty: 'Medium', topicTags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'] },
  { frontendId: '133', title: 'Clone Graph', titleSlug: 'clone-graph', difficulty: 'Medium', topicTags: ['Hash Table', 'Depth-First Search', 'Breadth-First Search', 'Graph'] },
  { frontendId: '134', title: 'Gas Station', titleSlug: 'gas-station', difficulty: 'Medium', topicTags: ['Array', 'Greedy'] },
  { frontendId: '138', title: 'Copy List with Random Pointer', titleSlug: 'copy-list-with-random-pointer', difficulty: 'Medium', topicTags: ['Hash Table', 'Linked List'] },
  { frontendId: '139', title: 'Word Break', titleSlug: 'word-break', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'String', 'Dynamic Programming', 'Trie', 'Memoization'] },
  { frontendId: '146', title: 'LRU Cache', titleSlug: 'lru-cache', difficulty: 'Medium', topicTags: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'] },
  { frontendId: '148', title: 'Sort List', titleSlug: 'sort-list', difficulty: 'Medium', topicTags: ['Linked List', 'Two Pointers', 'Divide and Conquer', 'Sorting', 'Merge Sort'] },
  { frontendId: '150', title: 'Evaluate Reverse Polish Notation', titleSlug: 'evaluate-reverse-polish-notation', difficulty: 'Medium', topicTags: ['Array', 'Math', 'Stack'] },
  { frontendId: '153', title: 'Find Minimum in Rotated Sorted Array', titleSlug: 'find-minimum-in-rotated-sorted-array', difficulty: 'Medium', topicTags: ['Array', 'Binary Search'] },
  { frontendId: '155', title: 'Min Stack', titleSlug: 'min-stack', difficulty: 'Medium', topicTags: ['Stack', 'Design'] },
  { frontendId: '162', title: 'Find Peak Element', titleSlug: 'find-peak-element', difficulty: 'Medium', topicTags: ['Array', 'Binary Search'] },
  { frontendId: '167', title: 'Two Sum II - Input Array Is Sorted', titleSlug: 'two-sum-ii-input-array-is-sorted', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers', 'Binary Search'] },
  { frontendId: '172', title: 'Factorial Trailing Zeroes', titleSlug: 'factorial-trailing-zeroes', difficulty: 'Medium', topicTags: ['Math'] },
  { frontendId: '198', title: 'House Robber', titleSlug: 'house-robber', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming'] },
  { frontendId: '199', title: 'Binary Tree Right Side View', titleSlug: 'binary-tree-right-side-view', difficulty: 'Medium', topicTags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'] },
  { frontendId: '200', title: 'Number of Islands', titleSlug: 'number-of-islands', difficulty: 'Medium', topicTags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'] },
  { frontendId: '201', title: 'Bitwise AND of Numbers Range', titleSlug: 'bitwise-and-of-numbers-range', difficulty: 'Medium', topicTags: ['Bit Manipulation'] },
  { frontendId: '207', title: 'Course Schedule', titleSlug: 'course-schedule', difficulty: 'Medium', topicTags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'] },
  { frontendId: '208', title: 'Implement Trie (Prefix Tree)', titleSlug: 'implement-trie-prefix-tree', difficulty: 'Medium', topicTags: ['Hash Table', 'String', 'Design', 'Trie'] },
  { frontendId: '209', title: 'Minimum Size Subarray Sum', titleSlug: 'minimum-size-subarray-sum', difficulty: 'Medium', topicTags: ['Array', 'Binary Search', 'Sliding Window', 'Prefix Sum'] },
  { frontendId: '210', title: 'Course Schedule II', titleSlug: 'course-schedule-ii', difficulty: 'Medium', topicTags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'] },
  { frontendId: '211', title: 'Design Add and Search Words Data Structure', titleSlug: 'design-add-and-search-words-data-structure', difficulty: 'Medium', topicTags: ['String', 'Depth-First Search', 'Design', 'Trie'] },
  { frontendId: '215', title: 'Kth Largest Element in an Array', titleSlug: 'kth-largest-element-in-an-array', difficulty: 'Medium', topicTags: ['Array', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'] },
  { frontendId: '221', title: 'Maximal Square', titleSlug: 'maximal-square', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Matrix'] },
  { frontendId: '230', title: 'Kth Smallest Element in a BST', titleSlug: 'kth-smallest-element-in-a-bst', difficulty: 'Medium', topicTags: ['Tree', 'Binary Search Tree', 'Binary Tree'] },
  { frontendId: '236', title: 'Lowest Common Ancestor of a Binary Tree', titleSlug: 'lowest-common-ancestor-of-a-binary-tree', difficulty: 'Medium', topicTags: ['Tree', 'Depth-First Search', 'Binary Tree'] },
  { frontendId: '238', title: 'Product of Array Except Self', titleSlug: 'product-of-array-except-self', difficulty: 'Medium', topicTags: ['Array', 'Prefix Sum'] },
  { frontendId: '289', title: 'Game of Life', titleSlug: 'game-of-life', difficulty: 'Medium', topicTags: ['Array', 'Matrix', 'Simulation'] },
  { frontendId: '300', title: 'Longest Increasing Subsequence', titleSlug: 'longest-increasing-subsequence', difficulty: 'Medium', topicTags: ['Array', 'Binary Search', 'Dynamic Programming'] },
  { frontendId: '322', title: 'Coin Change', titleSlug: 'coin-change', difficulty: 'Medium', topicTags: ['Array', 'Dynamic Programming', 'Breadth-First Search'] },
  { frontendId: '373', title: 'Find K Pairs with Smallest Sums', titleSlug: 'find-k-pairs-with-smallest-sums', difficulty: 'Medium', topicTags: ['Array', 'Heap (Priority Queue)'] },
  { frontendId: '380', title: 'Insert Delete GetRandom O(1)', titleSlug: 'insert-delete-getrandom-o1', difficulty: 'Medium', topicTags: ['Array', 'Hash Table', 'Math', 'Design', 'Randomized'] },
  { frontendId: '399', title: 'Evaluate Division', titleSlug: 'evaluate-division', difficulty: 'Medium', topicTags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Graph', 'Shortest Path'] },
  { frontendId: '433', title: 'Minimum Genetic Mutation', titleSlug: 'minimum-genetic-mutation', difficulty: 'Medium', topicTags: ['Hash Table', 'String', 'Breadth-First Search'] },
  { frontendId: '452', title: 'Minimum Number of Arrows to Burst Balloons', titleSlug: 'minimum-number-of-arrows-to-burst-balloons', difficulty: 'Medium', topicTags: ['Array', 'Greedy', 'Sorting'] },
  { frontendId: '909', title: 'Snakes and Ladders', titleSlug: 'snakes-and-ladders', difficulty: 'Medium', topicTags: ['Array', 'Breadth-First Search', 'Matrix'] },

  // Hard
  { frontendId: '4', title: 'Median of Two Sorted Arrays', titleSlug: 'median-of-two-sorted-arrays', difficulty: 'Hard', topicTags: ['Array', 'Binary Search', 'Divide and Conquer'] },
  { frontendId: '10', title: 'Regular Expression Matching', titleSlug: 'regular-expression-matching', difficulty: 'Hard', topicTags: ['String', 'Dynamic Programming', 'Recursion'] },
  { frontendId: '23', title: 'Merge k Sorted Lists', titleSlug: 'merge-k-sorted-lists', difficulty: 'Hard', topicTags: ['Linked List', 'Divide and Conquer', 'Heap (Priority Queue)', 'Merge Sort'] },
  { frontendId: '25', title: 'Reverse Nodes in k-Group', titleSlug: 'reverse-nodes-in-k-group', difficulty: 'Hard', topicTags: ['Linked List', 'Recursion'] },
  { frontendId: '30', title: 'Substring with Concatenation of All Words', titleSlug: 'substring-with-concatenation-of-all-words', difficulty: 'Hard', topicTags: ['Hash Table', 'String', 'Sliding Window'] },
  { frontendId: '42', title: 'Trapping Rain Water', titleSlug: 'trapping-rain-water', difficulty: 'Hard', topicTags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'] },
  { frontendId: '52', title: 'N-Queens II', titleSlug: 'n-queens-ii', difficulty: 'Hard', topicTags: ['Backtracking'] },
  { frontendId: '68', title: 'Text Justification', titleSlug: 'text-justification', difficulty: 'Hard', topicTags: ['Array', 'String', 'Simulation'] },
  { frontendId: '76', title: 'Minimum Window Substring', titleSlug: 'minimum-window-substring', difficulty: 'Hard', topicTags: ['Hash Table', 'String', 'Sliding Window'] },
  { frontendId: '84', title: 'Largest Rectangle in Histogram', titleSlug: 'largest-rectangle-in-histogram', difficulty: 'Hard', topicTags: ['Array', 'Stack', 'Monotonic Stack'] },
  { frontendId: '123', title: 'Best Time to Buy and Sell Stock III', titleSlug: 'best-time-to-buy-and-sell-stock-iii', difficulty: 'Hard', topicTags: ['Array', 'Dynamic Programming'] },
  { frontendId: '124', title: 'Binary Tree Maximum Path Sum', titleSlug: 'binary-tree-maximum-path-sum', difficulty: 'Hard', topicTags: ['Dynamic Programming', 'Tree', 'Depth-First Search', 'Binary Tree'] },
  { frontendId: '127', title: 'Word Ladder', titleSlug: 'word-ladder', difficulty: 'Hard', topicTags: ['Hash Table', 'String', 'Breadth-First Search'] },
  { frontendId: '149', title: 'Max Points on a Line', titleSlug: 'max-points-on-a-line', difficulty: 'Hard', topicTags: ['Array', 'Hash Table', 'Math', 'Geometry'] },
  { frontendId: '188', title: 'Best Time to Buy and Sell Stock IV', titleSlug: 'best-time-to-buy-and-sell-stock-iv', difficulty: 'Hard', topicTags: ['Array', 'Dynamic Programming'] },
  { frontendId: '224', title: 'Basic Calculator', titleSlug: 'basic-calculator', difficulty: 'Hard', topicTags: ['Math', 'String', 'Stack', 'Recursion'] },
  { frontendId: '295', title: 'Find Median from Data Stream', titleSlug: 'find-median-from-data-stream', difficulty: 'Hard', topicTags: ['Two Pointers', 'Design', 'Sorting', 'Heap (Priority Queue)', 'Data Stream'] },
  { frontendId: '502', title: 'IPO', titleSlug: 'ipo', difficulty: 'Hard', topicTags: ['Array', 'Greedy', 'Sorting', 'Heap (Priority Queue)'] }
];

// Presets
const PRESET_LISTS = {
  'top-interview-150': {
    id: 'top-interview-150',
    title: 'Top Interview 150',
    description: 'The standard curated list of top 150 essential coding interview questions.',
    problems: PROBLEM_CATALOG
  }
};

function searchCatalog({ query = '', difficulty = '', topic = '', excludedSlugs = [], limit = 50 }) {
  const cleanQuery = query.trim().toLowerCase();
  const excludedSet = new Set(excludedSlugs.map(s => s.toLowerCase()));

  const filtered = PROBLEM_CATALOG.filter(p => {
    if (difficulty && p.difficulty.toLowerCase() !== difficulty.toLowerCase()) return false;
    if (topic && !p.topicTags.some(t => t.toLowerCase() === topic.toLowerCase())) return false;
    if (cleanQuery) {
      const matchId = p.frontendId.toLowerCase().includes(cleanQuery);
      const matchTitle = p.title.toLowerCase().includes(cleanQuery);
      const matchSlug = p.titleSlug.toLowerCase().includes(cleanQuery);
      if (!matchId && !matchTitle && !matchSlug) return false;
    }
    return true;
  });

  return filtered.slice(0, limit).map(p => ({
    ...p,
    usedInSeason: excludedSet.has(p.titleSlug.toLowerCase())
  }));
}

async function resolveProblem(input, excludedSlugs = []) {
  if (!input) return null;
  let clean = input.trim();
  const urlMatch = clean.match(/leetcode\.com\/problems\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) clean = urlMatch[1];

  const excludedSet = new Set(excludedSlugs.map(s => s.toLowerCase()));
  const localMatch = PROBLEM_CATALOG.find(
    p => p.titleSlug.toLowerCase() === clean.toLowerCase() || p.frontendId === clean
  );

  if (localMatch) {
    return {
      ...localMatch,
      usedInSeason: excludedSet.has(localMatch.titleSlug.toLowerCase())
    };
  }

  try {
    const live = await getQuestionDetails(clean);
    if (live) {
      return {
        ...live,
        usedInSeason: excludedSet.has(live.titleSlug.toLowerCase())
      };
    }
  } catch (err) {
    console.error('Failed to resolve live problem:', err.message);
  }

  return null;
}

function generateRandomRoundFromPool({
  pool = PROBLEM_CATALOG,
  usedSlugs = [],
  countEasy = 1,
  countMedium = 3,
  countHard = 2,
  countTotal = null
}) {
  const usedSet = new Set(usedSlugs.map(s => s.toLowerCase()));
  const remainingPool = pool.filter(p => !usedSet.has(p.titleSlug.toLowerCase()));

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  if (countTotal && countTotal > 0 && (!countEasy && !countMedium && !countHard)) {
    const selected = shuffle(remainingPool).slice(0, countTotal);
    return {
      problems: selected.map((p, idx) => ({ ...p, points: (idx + 1) * 100 })),
      remainingCount: remainingPool.length - selected.length,
      totalPoolCount: pool.length,
      usedCount: usedSlugs.length + selected.length
    };
  }

  const easyPool = remainingPool.filter(p => p.difficulty === 'Easy');
  const mediumPool = remainingPool.filter(p => p.difficulty === 'Medium');
  const hardPool = remainingPool.filter(p => p.difficulty === 'Hard');

  const selectedEasy = shuffle(easyPool).slice(0, Number(countEasy) || 0);
  const selectedMedium = shuffle(mediumPool).slice(0, Number(countMedium) || 0);
  const selectedHard = shuffle(hardPool).slice(0, Number(countHard) || 0);

  const selected = [...selectedEasy, ...selectedMedium, ...selectedHard];

  return {
    problems: selected.map((p, idx) => ({ ...p, points: (idx + 1) * 100 })),
    remainingCount: remainingPool.length - selected.length,
    totalPoolCount: pool.length,
    usedCount: usedSlugs.length + selected.length
  };
}

async function resolveListOrUrls(input) {
  if (!input || !input.trim()) return [];
  const text = input.trim();

  // Check if input is a LeetCode problem-list link
  const listMatch = text.match(/leetcode\.com\/problem-list\/([a-zA-Z0-9_-]+)/);
  if (listMatch) {
    const listSlug = listMatch[1];
    const listQuestions = await getQuestionsFromList(listSlug);
    if (listQuestions && listQuestions.length > 0) {
      return listQuestions;
    }
  }

  // Otherwise, split by newline/comma and resolve individual problems
  const items = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  const resolved = [];
  const seenSlugs = new Set();

  for (const item of items) {
    // Check if line itself is a list URL
    const itemMatch = item.match(/leetcode\.com\/problem-list\/([a-zA-Z0-9_-]+)/);
    if (itemMatch) {
      const listQuestions = await getQuestionsFromList(itemMatch[1]);
      listQuestions.forEach(q => {
        if (!seenSlugs.has(q.titleSlug.toLowerCase())) {
          seenSlugs.add(q.titleSlug.toLowerCase());
          resolved.push(q);
        }
      });
      continue;
    }

    const prob = await resolveProblem(item);
    if (prob && !seenSlugs.has(prob.titleSlug.toLowerCase())) {
      seenSlugs.add(prob.titleSlug.toLowerCase());
      resolved.push(prob);
    }
  }

  return resolved;
}

module.exports = {
  PROBLEM_CATALOG,
  PRESET_LISTS,
  searchCatalog,
  resolveProblem,
  resolveListOrUrls,
  generateRandomRoundFromPool
};
