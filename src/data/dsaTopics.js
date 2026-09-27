/** 16 DSA topics (PRD §10.6). */
export const DSA_TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Binary Search',
  'Sorting', 'Recursion', 'Trees', 'BST', 'Heap', 'Hashing',
  'Graphs', 'DP', 'Greedy', 'Backtracking',
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const DSA_STATUSES = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'solved', label: 'Solved' },
  { value: 'review', label: 'Review' },
];

/** A handful of classic starters so the table is never an empty shell. */
export const DEFAULT_DSA_PROBLEMS = [
  { title: 'Two Sum', topic: 'Arrays', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' },
  { title: 'Best Time to Buy and Sell Stock', topic: 'Arrays', difficulty: 'Easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
  { title: 'Longest Substring Without Repeating Characters', topic: 'Strings', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
  { title: 'Valid Anagram', topic: 'Strings', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-anagram/' },
  { title: 'Reverse Linked List', topic: 'Linked List', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-linked-list/' },
  { title: 'Merge Two Sorted Lists', topic: 'Linked List', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
  { title: 'Valid Parentheses', topic: 'Stack', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses/' },
  { title: 'Min Stack', topic: 'Stack', difficulty: 'Medium', url: 'https://leetcode.com/problems/min-stack/' },
  { title: 'Implement Queue using Stacks', topic: 'Queue', difficulty: 'Easy', url: 'https://leetcode.com/problems/implement-queue-using-stacks/' },
  { title: 'Search in Rotated Sorted Array', topic: 'Binary Search', difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
  { title: 'Koko Eating Bananas', topic: 'Binary Search', difficulty: 'Medium', url: 'https://leetcode.com/problems/koko-eating-bananas/' },
  { title: 'Sort Colors', topic: 'Sorting', difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-colors/' },
  { title: 'Subsets', topic: 'Recursion', difficulty: 'Medium', url: 'https://leetcode.com/problems/subsets/' },
  { title: 'Maximum Depth of Binary Tree', topic: 'Trees', difficulty: 'Easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
  { title: 'Binary Tree Level Order Traversal', topic: 'Trees', difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
  { title: 'Validate Binary Search Tree', topic: 'BST', difficulty: 'Medium', url: 'https://leetcode.com/problems/validate-binary-search-tree/' },
  { title: 'Kth Largest Element in an Array', topic: 'Heap', difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },
  { title: 'Group Anagrams', topic: 'Hashing', difficulty: 'Medium', url: 'https://leetcode.com/problems/group-anagrams/' },
  { title: 'Number of Islands', topic: 'Graphs', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-islands/' },
  { title: 'Course Schedule', topic: 'Graphs', difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule/' },
  { title: 'Climbing Stairs', topic: 'DP', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/' },
  { title: 'Coin Change', topic: 'DP', difficulty: 'Medium', url: 'https://leetcode.com/problems/coin-change/' },
  { title: 'Longest Increasing Subsequence', topic: 'DP', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-increasing-subsequence/' },
  { title: 'Jump Game', topic: 'Greedy', difficulty: 'Medium', url: 'https://leetcode.com/problems/jump-game/' },
  { title: 'N-Queens', topic: 'Backtracking', difficulty: 'Hard', url: 'https://leetcode.com/problems/n-queens/' },
];
