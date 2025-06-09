import { db } from "./db";
import { friends, activities, relationships } from "@shared/schema";

const sampleFriends = [
  {
    firstName: "Sarah",
    lastName: "Chen",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=400&h=400&fit=crop&crop=face",
    location: "San Francisco, CA",
    category: "close_friends",
    interests: ["Photography", "Hiking", "Coffee"],
    lifestyle: "Active",
    hasKids: false,
    partner: "Mark",
    notes: "Met at college, amazing photographer. Lives in Mission District.",
    contactInfo: JSON.stringify({ phone: "+1-415-555-0123", email: "sarah.chen@email.com" }),
    howDidYouMeet: "College roommates"
  },
  {
    firstName: "Marcus",
    lastName: "Johnson",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    location: "New York, NY",
    category: "work_friends",
    interests: ["Technology", "Gaming", "Basketball"],
    lifestyle: "Workaholic",
    hasKids: false,
    partner: null,
    notes: "Software engineer at Google. Great at debugging complex problems.",
    contactInfo: JSON.stringify({ phone: "+1-212-555-0456", email: "marcus.j@email.com" }),
    howDidYouMeet: "Started working together in 2022"
  },
  {
    firstName: "Emily",
    lastName: "Rodriguez",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    location: "Los Angeles, CA",
    category: "close_friends",
    interests: ["Art", "Music", "Travel"],
    lifestyle: "Creative",
    hasKids: true,
    partner: "David",
    notes: "Childhood friend, now a successful artist. Has two kids - Emma and Alex.",
    contactInfo: JSON.stringify({ phone: "+1-323-555-0789", email: "emily.r@email.com" }),
    howDidYouMeet: "Childhood friends"
  },
  {
    firstName: "Alex",
    lastName: "Thompson",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    location: "Seattle, WA",
    category: "friends",
    interests: ["Cycling", "Reading", "Cooking"],
    lifestyle: "Balanced",
    hasKids: false,
    partner: "Jamie",
    notes: "Met through Sarah. Works in tech, amazing cook.",
    contactInfo: JSON.stringify({ phone: "+1-206-555-0321", email: "alex.t@email.com" }),
    howDidYouMeet: "Introduced by Sarah"
  },
  {
    firstName: "Lisa",
    lastName: "Wang",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    location: "Boston, MA",
    category: "work_friends",
    interests: ["Finance", "Yoga", "Wine"],
    lifestyle: "Professional",
    hasKids: false,
    partner: null,
    notes: "Investment banker, surprisingly zen. Great wine collection.",
    contactInfo: JSON.stringify({ phone: "+1-617-555-0654", email: "lisa.w@email.com" }),
    howDidYouMeet: "Previous company colleague"
  },
  {
    firstName: "David",
    lastName: "Miller",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    location: "Austin, TX",
    category: "friends",
    interests: ["Music", "BBQ", "Startups"],
    lifestyle: "Entrepreneurial",
    hasKids: true,
    partner: "Jessica",
    notes: "Serial entrepreneur, amazing BBQ skills. Has a 5-year-old daughter.",
    contactInfo: JSON.stringify({ phone: "+1-512-555-0987", email: "david.m@email.com" }),
    howDidYouMeet: "Startup meetup in 2020"
  },
  {
    firstName: "Rachel",
    lastName: "Kim",
    photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
    location: "Portland, OR",
    category: "new_friends",
    interests: ["Design", "Coffee", "Sustainability"],
    lifestyle: "Eco-conscious",
    hasKids: false,
    partner: null,
    notes: "UX designer, environmental activist. Makes the best matcha lattes.",
    contactInfo: JSON.stringify({ phone: "+1-503-555-0234", email: "rachel.k@email.com" }),
    howDidYouMeet: "Design conference last month"
  },
  {
    firstName: "James",
    lastName: "Wilson",
    photo: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=400&h=400&fit=crop&crop=face",
    location: "Denver, CO",
    category: "friends",
    interests: ["Skiing", "Photography", "Craft Beer"],
    lifestyle: "Outdoorsy",
    hasKids: false,
    partner: "Kate",
    notes: "Ski instructor in winter, photographer in summer. Lives for powder days.",
    contactInfo: JSON.stringify({ phone: "+1-303-555-0567", email: "james.w@email.com" }),
    howDidYouMeet: "Ski trip in Aspen"
  },
  {
    firstName: "Nina",
    lastName: "Patel",
    photo: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
    location: "San Francisco, CA",
    category: "close_friends",
    interests: ["Meditation", "Cooking", "Gardening"],
    lifestyle: "Mindful",
    hasKids: false,
    partner: "Raj",
    notes: "Meditation teacher who grows her own vegetables. Makes incredible Indian food.",
    contactInfo: JSON.stringify({ phone: "+1-415-555-0890", email: "nina.p@email.com" }),
    howDidYouMeet: "Meditation retreat in 2019"
  },
  {
    firstName: "Jake",
    lastName: "Taylor",
    photo: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face",
    location: "Chicago, IL",
    category: "new_friends",
    interests: ["Running", "History", "Museums"],
    lifestyle: "Academic",
    hasKids: false,
    partner: null,
    notes: "PhD student in history. Marathon runner. Knows everything about Chicago architecture.",
    contactInfo: JSON.stringify({ phone: "+1-312-555-0123", email: "jake.t@email.com" }),
    howDidYouMeet: "Running group meetup"
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
      description: `Added ${friend.firstName} ${friend.lastName || ''} to your friends`
    }));
    
    // Add some additional activities
    activitiesToCreate.push(
      {
        friendId: insertedFriends[0].id,
        activityType: "updated",
        description: `Updated ${insertedFriends[0].firstName} ${insertedFriends[0].lastName || ''}'s information`
      },
      {
        friendId: insertedFriends[1].id,
        activityType: "interacted",
        description: `Had coffee with ${insertedFriends[1].firstName} ${insertedFriends[1].lastName || ''}`
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