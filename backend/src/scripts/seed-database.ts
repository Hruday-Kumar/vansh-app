/**
 * 🪷 DATABASE SEED SCRIPT
 * Populates the database with sample family data
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';

dotenv.config();

async function seedDatabase() {
  console.log('🪷 Seeding Vansh database with sample data...\n');
  
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // ═══════════════════════════════════════════════════════════
    // CREATE SAMPLE FAMILY
    // ═══════════════════════════════════════════════════════════
    
    const familyId = uuidv4();
    await conn.query(`
      INSERT INTO families (id, name, surname, description, privacy_level, plan, settings)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      familyId,
      'The Sharma Heritage',
      'Sharma',
      'A proud family tracing roots to Rajasthan, preserving our rich cultural heritage through stories and traditions.',
      'private',
      'heritage',
      JSON.stringify({
        theme: 'traditional',
        language: 'en',
        notifications: true,
      })
    ]);
    console.log('✅ Family created:', familyId);
    
    // ═══════════════════════════════════════════════════════════
    // CREATE FAMILY MEMBERS
    // ═══════════════════════════════════════════════════════════
    
    const members: { id: string; name: string; relation: string }[] = [];
    
    // Great-grandparents
    const greatGrandpaId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, gender, birth_date, death_date, birth_place, is_alive, bio, occupation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      greatGrandpaId, familyId, 'Raghunath', 'Sharma', 'male',
      '1920-03-15', '1995-08-20', 'Jaipur, Rajasthan', false,
      'A respected teacher who believed in education for all. Founded the first school in our village.',
      'Teacher & Social Worker'
    ]);
    members.push({ id: greatGrandpaId, name: 'Raghunath Sharma', relation: 'Great Grandfather' });
    
    const greatGrandmaId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, maiden_name, gender, birth_date, death_date, birth_place, is_alive, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      greatGrandmaId, familyId, 'Savitri', 'Sharma', 'Joshi', 'female',
      '1925-07-22', '2000-12-10', 'Udaipur, Rajasthan', false,
      'Known for her delicious recipes and loving nature. Her dal is still made during every family gathering.'
    ]);
    members.push({ id: greatGrandmaId, name: 'Savitri Sharma', relation: 'Great Grandmother' });
    
    // Grandparents
    const grandpaId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, gender, birth_date, death_date, birth_place, is_alive, bio, occupation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      grandpaId, familyId, 'Mohan', 'Sharma', 'male',
      '1948-11-05', '2018-04-12', 'Jaipur, Rajasthan', false,
      'An engineer who built bridges across India. His stories of construction sites were legendary.',
      'Civil Engineer'
    ]);
    members.push({ id: grandpaId, name: 'Mohan Sharma', relation: 'Grandfather' });
    
    const grandmaId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, maiden_name, gender, birth_date, birth_place, is_alive, bio, current_city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      grandmaId, familyId, 'Kamla', 'Sharma', 'Verma', 'female',
      '1952-02-28', 'Delhi', true,
      'The heart of our family. Her wisdom and blessings guide us all. Still makes the best chai.',
      'Mumbai'
    ]);
    members.push({ id: grandmaId, name: 'Kamla Sharma', relation: 'Grandmother' });
    
    // Parents
    const fatherId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, gender, birth_date, birth_place, is_alive, bio, occupation, current_city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      fatherId, familyId, 'Vijay', 'Sharma', 'male',
      '1975-09-14', 'Jaipur, Rajasthan', true,
      'A doctor who has served the community for over 25 years. Continues his father\'s legacy of service.',
      'Doctor',
      'Mumbai'
    ]);
    members.push({ id: fatherId, name: 'Vijay Sharma', relation: 'Father' });
    
    const motherId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, maiden_name, gender, birth_date, birth_place, is_alive, bio, occupation, current_city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      motherId, familyId, 'Priya', 'Sharma', 'Kapoor', 'female',
      '1978-05-20', 'Pune, Maharashtra', true,
      'A talented artist and loving mother. Her paintings adorn our walls and tell stories of our heritage.',
      'Artist & Art Teacher',
      'Mumbai'
    ]);
    members.push({ id: motherId, name: 'Priya Sharma', relation: 'Mother' });
    
    // Current user (main user)
    const userId = uuidv4();
    const memberId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, gender, birth_date, birth_place, is_alive, bio, occupation, current_city, contact_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      memberId, familyId, 'Arjun', 'Sharma', 'male',
      '2000-01-15', 'Mumbai, Maharashtra', true,
      'Software engineer passionate about preserving family heritage through technology.',
      'Software Engineer',
      'Bangalore',
      'arjun@example.com'
    ]);
    members.push({ id: memberId, name: 'Arjun Sharma', relation: 'Self' });
    
    // Siblings
    const sisterId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, gender, birth_date, birth_place, is_alive, bio, occupation, current_city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sisterId, familyId, 'Ananya', 'Sharma', 'female',
      '2003-08-25', 'Mumbai, Maharashtra', true,
      'Medical student following in Papa\'s footsteps. Dreams of becoming a pediatrician.',
      'Medical Student',
      'Delhi'
    ]);
    members.push({ id: sisterId, name: 'Ananya Sharma', relation: 'Sister' });
    
    // Uncle and Aunt
    const uncleId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, gender, birth_date, birth_place, is_alive, bio, occupation, current_city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uncleId, familyId, 'Ajay', 'Sharma', 'male',
      '1972-04-10', 'Jaipur, Rajasthan', true,
      'Runs the family business started by Dadaji. Keeps our ancestral home in Jaipur.',
      'Businessman',
      'Jaipur'
    ]);
    members.push({ id: uncleId, name: 'Ajay Sharma', relation: 'Uncle' });
    
    // Cousin
    const cousinId = uuidv4();
    await conn.query(`
      INSERT INTO members (id, family_id, first_name, last_name, gender, birth_date, birth_place, is_alive, bio, current_city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cousinId, familyId, 'Rahul', 'Sharma', 'male',
      '1998-12-03', 'Jaipur, Rajasthan', true,
      'Architect designing modern homes with traditional elements.',
      'Jaipur'
    ]);
    members.push({ id: cousinId, name: 'Rahul Sharma', relation: 'Cousin' });
    
    // Update family root member
    await conn.query('UPDATE families SET root_member_id = ? WHERE id = ?', [greatGrandpaId, familyId]);
    
    console.log(`✅ ${members.length} family members created`);
    
    // ═══════════════════════════════════════════════════════════
    // CREATE RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════
    
    const relationships = [
      // Spouse relationships
      { from: greatGrandpaId, to: greatGrandmaId, type: 'spouse', marriage: '1942-05-10' },
      { from: grandpaId, to: grandmaId, type: 'spouse', marriage: '1970-02-14' },
      { from: fatherId, to: motherId, type: 'spouse', marriage: '1998-11-20' },
      
      // Parent-child
      { from: greatGrandpaId, to: grandpaId, type: 'parent' },
      { from: greatGrandmaId, to: grandpaId, type: 'parent' },
      { from: grandpaId, to: fatherId, type: 'parent' },
      { from: grandpaId, to: uncleId, type: 'parent' },
      { from: grandmaId, to: fatherId, type: 'parent' },
      { from: grandmaId, to: uncleId, type: 'parent' },
      { from: fatherId, to: memberId, type: 'parent' },
      { from: fatherId, to: sisterId, type: 'parent' },
      { from: motherId, to: memberId, type: 'parent' },
      { from: motherId, to: sisterId, type: 'parent' },
      { from: uncleId, to: cousinId, type: 'parent' },
      
      // Siblings
      { from: fatherId, to: uncleId, type: 'sibling' },
      { from: memberId, to: sisterId, type: 'sibling' },
    ];
    
    for (const rel of relationships) {
      await conn.query(`
        INSERT INTO relationships (id, family_id, from_member_id, to_member_id, relationship_type, marriage_date, prana_strength)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), familyId, rel.from, rel.to, rel.type,
        rel.marriage || null,
        Math.random() * 0.3 + 0.7 // Random strength 0.7-1.0
      ]);
    }
    console.log(`✅ ${relationships.length} relationships created`);
    
    // ═══════════════════════════════════════════════════════════
    // CREATE USER ACCOUNT
    // ═══════════════════════════════════════════════════════════
    
    const passwordHash = await bcrypt.hash('vansh123', 10);
    await conn.query(`
      INSERT INTO users (id, email, password_hash, member_id, family_id, role, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, 'arjun@example.com', passwordHash, memberId, familyId, 'admin', true]);
    console.log('✅ User account created: arjun@example.com / vansh123');
    
    // ═══════════════════════════════════════════════════════════
    // CREATE SAMPLE MEMORIES
    // ═══════════════════════════════════════════════════════════
    
    const memoryId1 = uuidv4();
    await conn.query(`
      INSERT INTO memories (id, family_id, type, uri, title, description, captured_at, uploaded_by, place_name, era_name, era_year, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      memoryId1, familyId, 'photo', '/uploads/memories/family-gathering.jpg',
      'Diwali 2023',
      'The whole family gathered at Dadiji\'s house. First Diwali after the renovation.',
      '2023-11-12', memberId, 'Mumbai',
      'Modern Era', 2023,
      JSON.stringify(['diwali', 'festival', 'family'])
    ]);
    
    const memoryId2 = uuidv4();
    await conn.query(`
      INSERT INTO memories (id, family_id, type, uri, title, description, captured_at, uploaded_by, place_name, era_name, era_year, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      memoryId2, familyId, 'photo', '/uploads/memories/old-wedding.jpg',
      'Dadaji & Dadiji Wedding',
      'A treasured photo from their wedding day in 1970.',
      '1970-02-14', memberId, 'Jaipur',
      'Golden Era', 1970,
      JSON.stringify(['wedding', 'vintage', 'grandparents'])
    ]);
    
    const memoryId3 = uuidv4();
    await conn.query(`
      INSERT INTO memories (id, family_id, type, uri, title, description, captured_at, uploaded_by, place_name, era_name, era_year, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      memoryId3, familyId, 'photo', '/uploads/memories/ancestral-home.jpg',
      'Ancestral Home in Jaipur',
      'Our family haveli that has been in the family for 5 generations.',
      '2020-01-26', memberId, 'Jaipur',
      'Heritage', 2020,
      JSON.stringify(['home', 'heritage', 'jaipur', 'haveli'])
    ]);
    console.log('✅ 3 sample memories created');
    
    // ═══════════════════════════════════════════════════════════
    // CREATE SAMPLE KATHAS
    // ═══════════════════════════════════════════════════════════
    
    const kathaId1 = uuidv4();
    await conn.query(`
      INSERT INTO kathas (id, family_id, type, audio_uri, duration_seconds, narrator_id, title, description, transcript, language, topics, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kathaId1, familyId, 'standalone_story', '/uploads/kathas/village-story.mp3',
      180, grandmaId,
      'Stories from the Village',
      'Dadiji shares memories of growing up in Jaipur.',
      'When I was young, life was very different. We would wake up before sunrise...',
      'hi',
      JSON.stringify(['childhood', 'village life', 'traditions']),
      JSON.stringify(['dadiji', 'stories', 'heritage'])
    ]);
    
    const kathaId2 = uuidv4();
    await conn.query(`
      INSERT INTO kathas (id, family_id, type, audio_uri, duration_seconds, narrator_id, title, description, transcript, language, topics, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kathaId2, familyId, 'interview', '/uploads/kathas/recipe-story.mp3',
      240, grandmaId,
      'Secret Recipe for Dal Makhani',
      'Dadiji\'s famous dal recipe passed down from her mother-in-law.',
      'The secret is patience. You must cook the dal slowly overnight...',
      'hi',
      JSON.stringify(['recipe', 'cooking', 'tradition']),
      JSON.stringify(['recipe', 'dal', 'cooking'])
    ]);
    console.log('✅ 2 sample kathas created');
    
    // ═══════════════════════════════════════════════════════════
    // CREATE SAMPLE VASIYATS
    // ═══════════════════════════════════════════════════════════
    
    const vasiyatId1 = uuidv4();
    await conn.query(`
      INSERT INTO vasiyats (id, family_id, creator_id, title, content_text, trigger_type, trigger_event, mood, allow_ai_persona)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      vasiyatId1, familyId, grandmaId,
      'For Your Wedding Day',
      'My dear Arjun, when you read this, you will be starting a new chapter of your life. Marriage is like cooking dal - it requires patience, the right ingredients, and lots of love. Never go to bed angry, always hold hands during difficult times, and remember that your partner chose you just as you chose them...',
      'event', 'wedding',
      'loving', true
    ]);
    
    // Add recipient
    await conn.query(`
      INSERT INTO vasiyat_recipients (id, vasiyat_id, member_id, relationship_label)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), vasiyatId1, memberId, 'My beloved grandson']);
    
    const vasiyatId2 = uuidv4();
    await conn.query(`
      INSERT INTO vasiyats (id, family_id, creator_id, title, content_text, trigger_type, trigger_date, mood, is_unlocked, unlocked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      vasiyatId2, familyId, fatherId,
      'On Your 25th Birthday',
      'Dear Arjun, twenty-five years ago you came into our lives and changed everything. You have grown into a man I am proud to call my son. Remember these life lessons: Work hard but make time for family. Money is important but relationships are priceless. Always help those less fortunate. Stay humble in success and strong in failure...',
      'date', '2025-01-15',
      'wisdom', true, new Date()
    ]);
    await conn.query(`
      INSERT INTO vasiyat_recipients (id, vasiyat_id, member_id, relationship_label)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), vasiyatId2, memberId, 'My son']);
    console.log('✅ 2 sample vasiyats created');
    
    // ═══════════════════════════════════════════════════════════
    // CREATE SAMPLE TRADITIONS
    // ═══════════════════════════════════════════════════════════
    
    const traditionId1 = uuidv4();
    await conn.query(`
      INSERT INTO traditions (id, family_id, created_by, name, description, category, frequency, date_or_occasion, origin_story, generations_count, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      traditionId1, familyId, grandmaId,
      'Diwali Puja Ritual',
      'Every Diwali, we gather at the eldest family member\'s home. The puja begins at sunset with everyone dressed in new clothes.',
      'ritual', 'yearly', 'Diwali',
      'Started by Pardadaji who believed that family blessings on Diwali bring prosperity for the whole year.',
      5,
      JSON.stringify(['diwali', 'puja', 'festival'])
    ]);
    
    const traditionId2 = uuidv4();
    await conn.query(`
      INSERT INTO traditions (id, family_id, created_by, name, description, category, frequency, date_or_occasion, recipe_ingredients, recipe_steps, generations_count, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      traditionId2, familyId, grandmaId,
      'Dadiji\'s Special Dal Makhani',
      'The signature dish of our family. Made on every special occasion and Sunday dinners.',
      'recipe', 'weekly', 'Every Sunday',
      JSON.stringify(['black urad dal', 'rajma', 'butter', 'cream', 'tomatoes', 'ginger-garlic paste', 'spices']),
      JSON.stringify([
        'Soak dal overnight',
        'Pressure cook with salt until very soft',
        'Prepare tomato masala in butter',
        'Add dal and simmer on low flame for 2-3 hours',
        'Finish with cream and butter'
      ]),
      4,
      JSON.stringify(['recipe', 'dal', 'sunday', 'family dinner'])
    ]);
    
    const traditionId3 = uuidv4();
    await conn.query(`
      INSERT INTO traditions (id, family_id, created_by, name, description, category, frequency, date_or_occasion, generations_count, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      traditionId3, familyId, greatGrandpaId,
      'Morning Prayer Gathering',
      'Every morning, the family gathers for a brief prayer and blessing before starting the day.',
      'ritual', 'daily', 'Every morning at 6 AM',
      5,
      JSON.stringify(['prayer', 'daily', 'blessing'])
    ]);
    console.log('✅ 3 sample traditions created');
    
    await conn.commit();
    
    console.log('\n🪷 Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Login credentials:');
    console.log('  Email: arjun@example.com');
    console.log('  Password: vansh123');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    await conn.rollback();
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

seedDatabase();
