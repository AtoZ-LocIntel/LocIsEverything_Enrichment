import React, { useState, useEffect } from 'react';
import { Zap, Clock, Sparkles } from 'lucide-react';
import { additionalTriviaQuestions } from '../data/triviaQuestions';

interface LoadingModalProps {
  isVisible: boolean;
  enrichmentCount: number;
}

interface ContentItem {
  question: string;
  answer: string;
  category: string;
  type: 'joke' | 'fact' | 'trivia' | 'tip';
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isVisible, enrichmentCount }) => {
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [shuffledContent, setShuffledContent] = useState<ContentItem[]>([]);

  // Function to shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array: ContentItem[]): ContentItem[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const contentItems: ContentItem[] = [
    // Original Jokes
    {
      question: "Why don't geographers ever get lost?",
      answer: "Because they always find themselves in the data.",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "What did the map say to the satellite?",
      answer: "\"You complete me.\"",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "Why did the shapefile break up with the geodatabase?",
      answer: "It just couldn't handle the relationship.",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "Why do GIS analysts make bad comedians?",
      answer: "Their jokes take too much processing time.",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "Why was the geocoding service always late?",
      answer: "It couldn't find the right address.",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "Why don't raster layers ever argue?",
      answer: "They prefer to stay pixel-perfect.",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "What did the polygon say to the point?",
      answer: "\"You complete me… but only if you're inside me.\"",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "Why did the GPS signal go to therapy?",
      answer: "Too many dropped connections.",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "Why did the cartographer go broke?",
      answer: "Because he kept working for scale.",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "Why did the location data go to school?",
      answer: "To get more coordinates.",
      category: "📍 Location Intelligence",
      type: 'joke'
    },
    {
      question: "Why was the SQL query so polite?",
      answer: "It always said SELECT please.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "Why did the database administrator break up with their partner?",
      answer: "Too many commit issues.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "What do you call an AI that makes maps?",
      answer: "Geo-GPT.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "Why did the tech startup founder love maps?",
      answer: "Because success is all about location, location, location.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "Why did the server go to the beach?",
      answer: "It needed a data break.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "Why do developers hate nature?",
      answer: "Too many bugs.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "Why don't programmers like geography?",
      answer: "They don't want to deal with layers.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "Why did the IoT device get promoted?",
      answer: "It always connected the dots.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "What's a geospatial analyst's favorite band?",
      answer: "Arcade Fire.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "Why was the machine learning model bad at directions?",
      answer: "It kept overfitting the route.",
      category: "💻 Tech & Data",
      type: 'joke'
    },
    {
      question: "Why did the cloud architect love geography?",
      answer: "Because everything is about regions.",
      category: "🤓 Mixed Tech + Geo",
      type: 'joke'
    },
    {
      question: "Why don't GIS people ever fight about projections?",
      answer: "Because that argument would flatten the room.",
      category: "🤓 Mixed Tech + Geo",
      type: 'joke'
    },
    {
      question: "Why did the open data cross the road?",
      answer: "To get to the public domain.",
      category: "🤓 Mixed Tech + Geo",
      type: 'joke'
    },
    {
      question: "Why did the routing API get detention?",
      answer: "It kept taking shortcuts.",
      category: "🤓 Mixed Tech + Geo",
      type: 'joke'
    },
    {
      question: "What's a location intelligence consultant's favorite pickup line?",
      answer: "\"You must be a POI—because I can't stop querying you.\"",
      category: "🤓 Mixed Tech + Geo",
      type: 'joke'
    },

    // Historical Facts
    {
      question: "What was the first city to have a comprehensive street addressing system?",
      answer: "Philadelphia in 1682, designed by William Penn with numbered streets and blocks.",
      category: "🏛️ Historical Facts",
      type: 'fact'
    },
    {
      question: "When was the first GPS satellite launched?",
      answer: "1978! The first Block I GPS satellite was launched on February 22, 1978.",
      category: "🏛️ Historical Facts",
      type: 'fact'
    },
    {
      question: "What was the first web mapping service?",
      answer: "MapQuest launched in 1996, predating Google Maps by 9 years!",
      category: "🏛️ Historical Facts",
      type: 'fact'
    },
    {
      question: "Who created the first modern atlas?",
      answer: "Abraham Ortelius published the first modern atlas 'Theatrum Orbis Terrarum' in 1570.",
      category: "🏛️ Historical Facts",
      type: 'fact'
    },
    {
      question: "What was the first commercial GIS software?",
      answer: "ARC/INFO, developed by ESRI in 1982, was the first commercial GIS software.",
      category: "🏛️ Historical Facts",
      type: 'fact'
    },

    // Geography Trivia
    {
      question: "Which country has the most time zones?",
      answer: "France with 12 time zones due to its overseas territories!",
      category: "🌍 Geography Trivia",
      type: 'trivia'
    },
    {
      question: "What's the most remote inhabited place on Earth?",
      answer: "Tristan da Cunha, a volcanic island in the South Atlantic, 1,750 miles from South Africa.",
      category: "🌍 Geography Trivia",
      type: 'trivia'
    },
    {
      question: "Which city is closest to the geographic center of the United States?",
      answer: "Lebanon, Kansas is the geographic center of the contiguous United States.",
      category: "🌍 Geography Trivia",
      type: 'trivia'
    },
    {
      question: "What's the longest straight line you can walk on Earth?",
      answer: "From Liberia to China - 8,000+ miles without crossing water!",
      category: "🌍 Geography Trivia",
      type: 'trivia'
    },
    {
      question: "Which country has the most islands?",
      answer: "Sweden with over 267,000 islands, though most are uninhabited.",
      category: "🌍 Geography Trivia",
      type: 'trivia'
    },

    // Pro Tips
    {
      question: "What's the most accurate way to geocode an address?",
      answer: "Use multiple geocoding services and take the centroid of results within 100m of each other.",
      category: "💡 Pro Tips",
      type: 'tip'
    },
    {
      question: "How can you improve POI data quality?",
      answer: "Cross-reference multiple data sources and validate against recent satellite imagery.",
      category: "💡 Pro Tips",
      type: 'tip'
    },
    {
      question: "What's the best practice for handling coordinate precision?",
      answer: "Store coordinates with 6+ decimal places for sub-meter accuracy in most applications.",
      category: "💡 Pro Tips",
      type: 'tip'
    },
    {
      question: "How do you choose the right map projection?",
      answer: "Use Web Mercator for web maps, Albers for US analysis, and UTM for local projects.",
      category: "💡 Pro Tips",
      type: 'tip'
    },
    {
      question: "What's the key to successful location-based marketing?",
      answer: "Combine demographic data with behavioral patterns and real-time location signals.",
      category: "💡 Pro Tips",
      type: 'tip'
    },

    // Additional Trivia Questions
    ...additionalTriviaQuestions
  ];

  useEffect(() => {
    if (!isVisible) {
      setShowInitialMessage(true);
      setCurrentContentIndex(0);
      setShowAnswer(false);
      return;
    }

    // Shuffle content when modal becomes visible
    setShuffledContent(shuffleArray(contentItems));

    // Show initial message for 4 seconds
    const initialTimer = setTimeout(() => {
      setShowInitialMessage(false);
    }, 4000);

    return () => clearTimeout(initialTimer);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || showInitialMessage || shuffledContent.length === 0) return;

    // Show question for 3 seconds, then answer for 3 seconds, then next content
    const questionTimer = setTimeout(() => {
      setShowAnswer(true);
    }, 3000);

    const answerTimer = setTimeout(() => {
      setShowAnswer(false);
      setCurrentContentIndex((prev) => {
        const nextIndex = prev + 1;
        // If we've reached the end, reshuffle and start over
        if (nextIndex >= shuffledContent.length) {
          setShuffledContent(shuffleArray(contentItems));
          return 0;
        }
        return nextIndex;
      });
    }, 6000);

    return () => {
      clearTimeout(questionTimer);
      clearTimeout(answerTimer);
    };
  }, [isVisible, showInitialMessage, currentContentIndex, shuffledContent.length, contentItems]);

  if (!isVisible) return null;

  const currentContent = shuffledContent[currentContentIndex] || contentItems[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4" style={{ height: '100dvh' }}>
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl max-w-2xl w-full mx-2 sm:mx-4 p-3 sm:p-8 text-white relative overflow-hidden" style={{ maxHeight: '90dvh' }}>
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/4 -right-8 w-32 h-32 bg-white bg-opacity-5 rounded-full animate-bounce"></div>
          <div className="absolute bottom-1/4 -left-6 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-28 h-28 bg-white bg-opacity-5 rounded-full animate-bounce"></div>
        </div>

        <div className="relative z-10">
                     {showInitialMessage ? (
             <div className="text-center space-y-4 sm:space-y-6">
               <div className="flex justify-center space-x-3 sm:space-x-4">
                 <img src="/assets/lociseverything.png" alt="The Location Is Everything Co" className="w-20 h-20 sm:w-24 sm:h-24 animate-bounce rounded-full object-cover" />
                 <Zap className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse text-yellow-300" />
                 <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce text-yellow-300" />
               </div>
               
               <h2 className="text-xl sm:text-3xl font-bold text-center mb-2 sm:mb-4">
                 Please be patient (it's free!)
               </h2>
               
               <div className="bg-white bg-opacity-20 rounded-xl p-3 sm:p-6 backdrop-blur-sm">
                 <p className="text-sm sm:text-lg leading-relaxed">
                   It's simple physics! The more enrichment options you choose, 
                   the longer the real-time queries take!
                 </p>
               </div>

               <div className="flex items-center justify-center space-x-2 text-yellow-300">
                 <Clock className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                 <span className="text-xs sm:text-sm">
                   Processing {enrichmentCount} enrichment{enrichmentCount !== 1 ? 's' : ''}...
                 </span>
               </div>
             </div>
          ) : (
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="flex justify-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 sm:p-4 backdrop-blur-sm">
                  <img src="/assets/lociseverything.png" alt="The Location Is Everything Co" className="w-12 h-12 sm:w-16 sm:h-16 animate-pulse rounded-full object-cover" />
                </div>
              </div>

                             <div className="bg-white bg-opacity-20 rounded-xl p-3 sm:p-6 backdrop-blur-sm min-h-[140px] sm:min-h-[200px] flex flex-col justify-center">
                 <div className="mb-4">
                   <span className="inline-block bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-medium">
                     {currentContent.category}
                   </span>
                 </div>
                 
                 <h3 className="text-sm sm:text-xl font-semibold mb-2 sm:mb-4 leading-relaxed">
                   {currentContent.type === 'fact' && "Did you know?"}
                   {currentContent.type === 'trivia' && "Fun fact:"}
                   {currentContent.type === 'tip' && "Pro tip:"}
                   {currentContent.type === 'joke' && ""}
                   <br />
                   {currentContent.question}
                 </h3>
                 
                 {showAnswer && (
                   <div className="animate-fadeIn">
                     <div className="border-t border-white border-opacity-30 pt-3 sm:pt-4">
                       <p className="text-sm sm:text-lg font-medium text-yellow-200">
                         {currentContent.answer}
                       </p>
                     </div>
                   </div>
                 )}
               </div>

               <div className="flex justify-center space-x-2">
                 {shuffledContent.map((_, index) => (
                   <div
                     key={index}
                     className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                       index === currentContentIndex 
                         ? 'bg-yellow-300' 
                         : 'bg-white bg-opacity-30'
                     }`}
                   />
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
