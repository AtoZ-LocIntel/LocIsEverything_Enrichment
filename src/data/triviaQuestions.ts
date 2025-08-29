export interface TriviaQuestion {
  question: string;
  answer: string;
  category: string;
  type: 'trivia';
}

export const additionalTriviaQuestions: TriviaQuestion[] = [
  {
    question: "What is the only country in the world located on two continents?",
    answer: "Turkey",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "Which U.S. state has the most time zones?",
    answer: "Alaska",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "What city is known as \"the city of canals\"?",
    answer: "Venice, Italy",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "Which river flows through the most countries?",
    answer: "Danube River (10 countries)",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "What is the world's most populous island?",
    answer: "Java (Indonesia)",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "Which country has the most neighboring countries?",
    answer: "China (14 neighbors)",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "What is the only U.S. state that borders just one other state?",
    answer: "Maine",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "Which country is both the smallest by area and population?",
    answer: "Vatican City",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "What is the largest desert in the world (by area)?",
    answer: "Antarctic Desert",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "Which city has the world's busiest airport by passenger traffic?",
    answer: "Atlanta (Hartsfield–Jackson Airport, USA)",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "What does the acronym \"GIS\" stand for?",
    answer: "Geographic Information System",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "Which coordinate system uses latitude and longitude?",
    answer: "Geographic Coordinate System (GCS)",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "What U.S. agency operates the Landsat satellite program?",
    answer: "NASA & USGS (jointly)",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "What technology is used to measure elevation from airborne lasers?",
    answer: "LiDAR (Light Detection and Ranging)",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "Which mapping service popularized the phrase \"Street View\"?",
    answer: "Google Maps",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "What company developed the \"Overture Maps\" project?",
    answer: "Meta, Microsoft, Amazon, and TomTom (founding members)",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "What is the standard file extension for shapefiles in GIS?",
    answer: ".shp",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "What open-source software is known as the \"Q\" in the GIS world?",
    answer: "QGIS (Quantum GIS)",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "Which country created the BeiDou navigation system?",
    answer: "China",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "What does GPS stand for?",
    answer: "Global Positioning System",
    category: "🗺️ GIS & Mapping",
    type: 'trivia'
  },
  {
    question: "What U.S. city is closest to the geographic center of the contiguous U.S.?",
    answer: "Lebanon, Kansas",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "Which country spans the most degrees of longitude?",
    answer: "Russia",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "What city is nicknamed \"The Big Easy\"?",
    answer: "New Orleans, Louisiana",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "What is the southernmost permanently inhabited place on Earth?",
    answer: "Puerto Toro, Chile (Navarino Island)",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  {
    question: "Which continent has no permanent human settlements?",
    answer: "Antarctica",
    category: "🌍 Geography Trivia",
    type: 'trivia'
  },
  // 🌍 World Geography
  {
    question: "What is the longest river in the world?",
    answer: "The Nile (though some argue the Amazon is slightly longer)",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  {
    question: "Which is the smallest continent by land area?",
    answer: "Australia",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  {
    question: "What is the capital of Canada?",
    answer: "Ottawa",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  {
    question: "Which ocean is the deepest?",
    answer: "Pacific Ocean",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  {
    question: "What is the tallest mountain above sea level?",
    answer: "Mount Everest",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  {
    question: "Which country has the largest population in Africa?",
    answer: "Nigeria",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  {
    question: "What is the capital of New Zealand?",
    answer: "Wellington",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  {
    question: "Which desert covers most of northern Africa?",
    answer: "The Sahara",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  {
    question: "What is the flattest continent?",
    answer: "Australia",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  {
    question: "Which European country has the most volcanoes?",
    answer: "Iceland",
    category: "🌍 World Geography",
    type: 'trivia'
  },
  // 🏙️ Countries & Cities
  {
    question: "What city is known as \"the Eternal City\"?",
    answer: "Rome",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  {
    question: "Which country has the most islands?",
    answer: "Sweden",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  {
    question: "What is the capital of South Korea?",
    answer: "Seoul",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  {
    question: "What is the largest country by land area?",
    answer: "Russia",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  {
    question: "Which U.S. city is called \"Motor City\"?",
    answer: "Detroit",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  {
    question: "Which country is nicknamed \"The Land of the Rising Sun\"?",
    answer: "Japan",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  {
    question: "What is the capital of Argentina?",
    answer: "Buenos Aires",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  {
    question: "What is the world's southernmost capital city?",
    answer: "Wellington, New Zealand",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  {
    question: "Which city is home to the world's tallest building (Burj Khalifa)?",
    answer: "Dubai",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  {
    question: "Which U.S. state has the most national parks?",
    answer: "California",
    category: "🏙️ Countries & Cities",
    type: 'trivia'
  },
  // 🌊 Water & Land Features
  {
    question: "What is the largest freshwater lake by surface area?",
    answer: "Lake Superior",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  {
    question: "Which sea separates Europe and Africa?",
    answer: "Mediterranean Sea",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  {
    question: "Which country is home to the Great Barrier Reef?",
    answer: "Australia",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  {
    question: "What is the world's largest peninsula?",
    answer: "The Arabian Peninsula",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  {
    question: "Which waterfall is the tallest in the world?",
    answer: "Angel Falls, Venezuela",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  {
    question: "Which strait separates Alaska and Russia?",
    answer: "Bering Strait",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  {
    question: "What is the largest island in the Mediterranean Sea?",
    answer: "Sicily",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  {
    question: "Which ocean is the warmest?",
    answer: "Indian Ocean",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  {
    question: "What is the largest bay in the world?",
    answer: "Bay of Bengal",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  {
    question: "Which sea has the highest salinity?",
    answer: "The Dead Sea",
    category: "🌊 Water & Land Features",
    type: 'trivia'
  },
  // 🗺️ Borders & Nations
  {
    question: "Which two countries share the world's longest international border?",
    answer: "United States and Canada",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  {
    question: "What is the only country that is also a continent?",
    answer: "Australia",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  {
    question: "Which country has the city Timbuktu?",
    answer: "Mali",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  {
    question: "What two continents are entirely in the Western Hemisphere?",
    answer: "North America and South America",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  {
    question: "Which Asian country has the most UNESCO World Heritage sites?",
    answer: "China",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  {
    question: "What country has the most pyramids?",
    answer: "Sudan",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  {
    question: "What is the capital of Iceland?",
    answer: "Reykjavik",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  {
    question: "Which European country is landlocked but has more lakes than any other country in Europe?",
    answer: "Switzerland",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  {
    question: "Which South American country is the only one that doesn't border Brazil?",
    answer: "Chile and Ecuador",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  {
    question: "What is the world's newest country (recognized in 2011)?",
    answer: "South Sudan",
    category: "🗺️ Borders & Nations",
    type: 'trivia'
  },
  // 🌐 Random Fun Facts
  {
    question: "What is the driest place on Earth?",
    answer: "Atacama Desert, Chile",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  },
  {
    question: "Which country is famous for fjords?",
    answer: "Norway",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  },
  {
    question: "Which mountain range separates Europe from Asia?",
    answer: "The Ural Mountains",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  },
  {
    question: "What country is known as the Horn of Africa?",
    answer: "Somalia",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  },
  {
    question: "Which U.S. state is the farthest west?",
    answer: "Alaska (the Aleutian Islands cross the 180° meridian)",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  },
  {
    question: "Which country has the most official languages?",
    answer: "South Africa (11)",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  },
  {
    question: "What is the most densely populated country in the world?",
    answer: "Monaco",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  },
  {
    question: "Which country is the only one with a flag that's not rectangular?",
    answer: "Nepal",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  },
  {
    question: "What is the highest capital city in the world?",
    answer: "La Paz, Bolivia",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  },
  {
    question: "Which U.S. city is nicknamed \"The Windy City\"?",
    answer: "Chicago",
    category: "🌐 Random Fun Facts",
    type: 'trivia'
  }
];
