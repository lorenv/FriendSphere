import { db } from "./db";
import { friends, activities, relationships } from "@shared/schema";

const sampleFriends = [
  {
    name: "Sarah Chen",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=400&h=400&fit=crop&crop=face",
    location: "San Francisco, CA",
    category: "close_friends",
    interests: ["Photography", "Hiking", "Coffee"],
    lifestyle: "Active",
    hasKids: false,
    partner: "Mark",
    notes: "Met at college, amazing photographer. Lives in Mission District.",
    contactInfo: JSON.stringify({ phone: "+1-415-555-0123", email: "sarah.chen@email.com" })
  },
  {
    name: "Marcus Johnson",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    location: "New York, NY",
    category: "work_friends",
    interests: ["Technology", "Gaming", "Basketball"],
    lifestyle: "Workaholic",
    hasKids: false,
    partner: null,
    notes: "Software engineer at Google. Great at debugging complex problems.",
    contactInfo: JSON.stringify({ phone: "+1-212-555-0456", email: "marcus.j@email.com" })
  },
  {
    name: "Emily Rodriguez",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    location: "Los Angeles, CA",
    category: "close_friends",
    interests: ["Art", "Music", "Travel"],
    lifestyle: "Creative",
    hasKids: true,
    partner: "David",
    notes: "Childhood friend, now a successful artist. Has two kids - Emma and Alex.",
    contactInfo: JSON.stringify({ phone: "+1-323-555-0789", email: "emily.r@email.com" })
  },
  {
    name: "Alex Thompson",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    location: "Seattle, WA",
    category: "friends",
    interests: ["Cycling", "Reading", "Cooking"],
    lifestyle: "Balanced",
    hasKids: false,
    partner: "Jamie",
    notes: "Met through Sarah. Works in tech, amazing cook.",
    contactInfo: JSON.stringify({ phone: "+1-206-555-0321", email: "alex.t@email.com" }),
    introducedBy: 1
  },
  {
    name: "Maya Patel",
    photo: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
    location: "Austin, TX",
    category: "new_friends",
    interests: ["Yoga", "Writing", "Nature"],
    lifestyle: "Relaxed",
    hasKids: false,
    partner: null,
    notes: "Just moved to Austin, works in marketing. Very creative and fun to be around.",
    contactInfo: JSON.stringify({ phone: "+1-512-555-0654", email: "maya.p@email.com" })
  },
  {
    name: "Jordan Kim",
    photo: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face",
    location: "Chicago, IL",
    category: "work_friends",
    interests: ["Business", "Sports", "Movies"],
    lifestyle: "Social",
    hasKids: true,
    partner: "Sam",
    notes: "Project manager at previous company. Great leader and mentor.",
    contactInfo: JSON.stringify({ phone: "+1-773-555-0987", email: "jordan.k@email.com" })
  },
  {
    name: "Zoe Martinez",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    location: "Miami, FL",
    category: "acquaintances",
    interests: ["Dancing", "Fashion", "Beach"],
    lifestyle: "Social",
    hasKids: false,
    partner: null,
    notes: "Met at a conference last year. Fashion designer with great style.",
    contactInfo: JSON.stringify({ phone: "+1-305-555-0147", email: "zoe.m@email.com" })
  },
  {
    name: "Ryan O'Connor",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    location: "Boston, MA",
    category: "friends",
    interests: ["History", "Politics", "Running"],
    lifestyle: "Analytical",
    hasKids: false,
    partner: "Katie",
    notes: "College roommate. Now works as a historian. Still runs marathons.",
    contactInfo: JSON.stringify({ phone: "+1-617-555-0258", email: "ryan.o@email.com" })
  },
  {
    name: "Luna Zhang",
    photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
    location: "Portland, OR",
    category: "close_friends",
    interests: ["Design", "Coffee", "Hiking"],
    lifestyle: "Creative",
    hasKids: false,
    partner: null,
    notes: "UX designer and coffee enthusiast. We go hiking every month.",
    contactInfo: JSON.stringify({ phone: "+1-503-555-0369", email: "luna.z@email.com" })
  },
  {
    name: "Ethan Williams",
    photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face",
    location: "Denver, CO",
    category: "new_friends",
    interests: ["Skiing", "Photography", "Adventure"],
    lifestyle: "Adventurous",
    hasKids: false,
    partner: null,
    notes: "Met at a photography workshop. Loves outdoor adventures and skiing.",
    contactInfo: JSON.stringify({ phone: "+1-303-555-0741", email: "ethan.w@email.com" })
  }
];

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seed...");
    
    // Clear existing data
    await db.delete(activities);
    await db.delete(relationships);
    await db.delete(friends);
    
    // Insert friends
    const insertedFriends = await db.insert(friends).values(sampleFriends).returning();
    console.log(`✅ Inserted ${insertedFriends.length} friends`);
    
    // Create some relationships based on introducedBy
    const relationshipsToCreate = [
      { friendId: 4, relatedFriendId: 1, relationshipType: "introduced_by" }, // Alex introduced by Sarah
    ];
    
    if (relationshipsToCreate.length > 0) {
      await db.insert(relationships).values(relationshipsToCreate);
      console.log(`✅ Created ${relationshipsToCreate.length} relationships`);
    }
    
    // Create some sample activities
    const activitiesToCreate = insertedFriends.map(friend => ({
      friendId: friend.id,
      activityType: "added",
      description: `Added ${friend.name} to your friends`
    }));
    
    // Add some additional activities
    activitiesToCreate.push(
      {
        friendId: insertedFriends[0].id,
        activityType: "updated",
        description: `Updated ${insertedFriends[0].name}'s information`
      },
      {
        friendId: insertedFriends[1].id,
        activityType: "interacted",
        description: `Had coffee with ${insertedFriends[1].name}`
      }
    );
    
    await db.insert(activities).values(activitiesToCreate);
    console.log(`✅ Created ${activitiesToCreate.length} activities`);
    
    console.log("🎉 Database seeded successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    return false;
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}