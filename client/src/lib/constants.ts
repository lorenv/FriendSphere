export const FRIEND_CATEGORIES = {
  close_friends: { label: "Close Friends", color: "coral", icon: "heart" },
  friends: { label: "Friends", color: "turquoise", icon: "users" },
  work_friends: { label: "Work Friends", color: "sky", icon: "briefcase" },
  new_friends: { label: "New Friends", color: "mint", icon: "user-plus" },
  acquaintances: { label: "Acquaintances", color: "lavender", icon: "user" },
  family: { label: "Family", color: "sunny", icon: "home" },
} as const;

export const ACTIVITY_TYPES = {
  added: "Added",
  updated: "Updated",
  moved: "Moved",
  interacted: "Interacted with",
} as const;

export const RELATIONSHIP_TYPES = {
  introduced_by: "Introduced by",
  partner: "Partner/Spouse",
  friend_of: "Friend of",
  colleague: "Colleague",
  family: "Family member",
} as const;

export const INTERESTS = [
  "Art", "Music", "Sports", "Technology", "Travel", "Cooking", "Reading",
  "Gaming", "Photography", "Fitness", "Design", "Business", "Movies",
  "Fashion", "Nature", "Science", "History", "Politics", "Writing",
  "Dancing", "Yoga", "Hiking", "Cycling", "Swimming", "Running"
] as const;

export const RELATIONSHIP_LEVELS = {
  acquaintance: { label: "Acquaintance", icon: "star", color: "emerald" },
  friend: { label: "Friend", icon: "shield", color: "blue" },
  close: { label: "Close", icon: "heart", color: "rose" },
  work: { label: "Work", icon: "briefcase", color: "slate" },
} as const;

export const LIFESTYLE_OPTIONS = [
  "Active", "Relaxed", "Social", "Quiet", "Adventurous", "Homebody",
  "Workaholic", "Balanced", "Creative", "Analytical", "Spontaneous",
  "Organized", "Minimalist", "Maximalist"
] as const;
