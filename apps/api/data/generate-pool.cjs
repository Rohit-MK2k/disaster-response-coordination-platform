const fs = require('fs');

const locations = [
  'Manhattan, NYC', 'Downtown Riverfront', 'Northern Ridge', 'Eastern District',
  'Los Angeles, CA', 'San Francisco, CA', 'Miami, FL', 'Chicago, IL', 'London, UK',
  'Tokyo, Japan', 'Nowhere', 'Random City', 'My Backyard'
];

const topics = [
  { tags: ['flood', 'water', 'emergency'], texts: ['The water is rising fast!', 'My basement is completely flooded.', 'Streets are like rivers right now.'] },
  { tags: ['fire', 'wildfire', 'smoke'], texts: ['Huge fire on the ridge!', 'Can barely breathe with all this smoke.', 'Evacuating now due to the flames.'] },
  { tags: ['outage', 'power', 'dark'], texts: ['Power is out across the whole district.', 'Anyone else sitting in the dark?', 'Grid failure is causing chaos.'] },
  { tags: ['earthquake', 'shaking'], texts: ['Did anyone else feel that earthquake?', 'My house is shaking!', 'Huge tremor just now!'] },
  { tags: ['sunny', 'dog', 'park'], texts: ['Beautiful day at the park with my dog.', 'Just having a picnic.', 'Lovely sunny weather today.'] },
  { tags: ['food', 'lunch'], texts: ['This sandwich is amazing.', 'Waiting in line for coffee.', 'Best pizza in the city!'] }
];

const pool = [];
let idCounter = 1;

// Guarantee perfectly paired data for the 3 local mock disasters
for (let i = 0; i < 200; i++) {
  // 1. Downtown Riverfront + Flood
  pool.push({
    id_str: `tweet_flood_${idCounter++}`,
    full_text: `The water is rising fast in the downtown area! #flood #emergency [${i}]`,
    user: { screen_name: `user_flood_${i}` },
    place: { full_name: 'Downtown Riverfront' },
    entities: { hashtags: [{ text: 'flood' }, { text: 'urgent' }] }
  });

  // 2. Northern Ridge + Wildfire
  pool.push({
    id_str: `tweet_fire_${idCounter++}`,
    full_text: `Huge wildfire spreading on the ridge! #wildfire #danger [${i}]`,
    user: { screen_name: `user_fire_${i}` },
    place: { full_name: 'Northern Ridge' },
    entities: { hashtags: [{ text: 'wildfire' }, { text: 'fire' }] }
  });

  // 3. Eastern District + Power Outage
  pool.push({
    id_str: `tweet_power_${idCounter++}`,
    full_text: `Power is completely out in the district. #outage [${i}]`,
    user: { screen_name: `user_power_${i}` },
    place: { full_name: 'Eastern District Substation' },
    entities: { hashtags: [{ text: 'outage' }, { text: 'infrastructure' }] }
  });
}

// Add 200 random noise reports
for (let i = 0; i < 200; i++) {
  const loc = locations[Math.floor(Math.random() * locations.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const text = topic.texts[Math.floor(Math.random() * topic.texts.length)];
  
  pool.push({
    id_str: `tweet_ext_${idCounter++}`,
    full_text: `${text} #noise [${i}]`,
    user: { screen_name: `random_user_${i}` },
    place: { full_name: loc },
    entities: { hashtags: [{ text: topic.tags[0] }] }
  });
}

// Guarantee some specific hits for tests
pool.push({
  id_str: `test_hit_1`,
  full_text: `Test fire in LA #fire`,
  user: { screen_name: `test_user_1` },
  place: { full_name: `Los Angeles, CA` },
  entities: { hashtags: [{ text: 'fire' }] }
});

pool.push({
  id_str: `test_hit_2`,
  full_text: `Another fire in LA #fire`,
  user: { screen_name: `test_user_2` },
  place: { full_name: `Los Angeles, CA` },
  entities: { hashtags: [{ text: 'fire' }] }
});

fs.writeFileSync('apps/api/data/mock-twitter-feed-pool.json', JSON.stringify(pool, null, 2));
console.log('Generated mock-twitter-feed-pool.json with', pool.length, 'records.');
