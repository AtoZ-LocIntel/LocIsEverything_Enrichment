import React, { useState, useEffect } from 'react';
import { MapPin, Zap, Clock, Sparkles } from 'lucide-react';

interface LoadingModalProps {
  isVisible: boolean;
  enrichmentCount: number;
}

interface Joke {
  question: string;
  answer: string;
  category: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isVisible, enrichmentCount }) => {
  const [currentJokeIndex, setCurrentJokeIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showInitialMessage, setShowInitialMessage] = useState(true);

  const jokes: Joke[] = [
    {
      question: "Why don't geographers ever get lost?",
      answer: "Because they always find themselves in the data.",
      category: "📍 Location Intelligence"
    },
    {
      question: "What did the map say to the satellite?",
      answer: "\"You complete me.\"",
      category: "📍 Location Intelligence"
    },
    {
      question: "Why did the shapefile break up with the geodatabase?",
      answer: "It just couldn't handle the relationship.",
      category: "📍 Location Intelligence"
    },
    {
      question: "Why do GIS analysts make bad comedians?",
      answer: "Their jokes take too much processing time.",
      category: "📍 Location Intelligence"
    },
    {
      question: "Why was the geocoding service always late?",
      answer: "It couldn't find the right address.",
      category: "📍 Location Intelligence"
    },
    {
      question: "Why don't raster layers ever argue?",
      answer: "They prefer to stay pixel-perfect.",
      category: "📍 Location Intelligence"
    },
    {
      question: "What did the polygon say to the point?",
      answer: "\"You complete me… but only if you're inside me.\"",
      category: "📍 Location Intelligence"
    },
    {
      question: "Why did the GPS signal go to therapy?",
      answer: "Too many dropped connections.",
      category: "📍 Location Intelligence"
    },
    {
      question: "Why did the cartographer go broke?",
      answer: "Because he kept working for scale.",
      category: "📍 Location Intelligence"
    },
    {
      question: "Why did the location data go to school?",
      answer: "To get more coordinates.",
      category: "📍 Location Intelligence"
    },
    {
      question: "Why was the SQL query so polite?",
      answer: "It always said SELECT please.",
      category: "💻 Tech & Data"
    },
    {
      question: "Why did the database administrator break up with their partner?",
      answer: "Too many commit issues.",
      category: "💻 Tech & Data"
    },
    {
      question: "What do you call an AI that makes maps?",
      answer: "Geo-GPT.",
      category: "💻 Tech & Data"
    },
    {
      question: "Why did the tech startup founder love maps?",
      answer: "Because success is all about location, location, location.",
      category: "💻 Tech & Data"
    },
    {
      question: "Why did the server go to the beach?",
      answer: "It needed a data break.",
      category: "💻 Tech & Data"
    },
    {
      question: "Why do developers hate nature?",
      answer: "Too many bugs.",
      category: "💻 Tech & Data"
    },
    {
      question: "Why don't programmers like geography?",
      answer: "They don't want to deal with layers.",
      category: "💻 Tech & Data"
    },
    {
      question: "Why did the IoT device get promoted?",
      answer: "It always connected the dots.",
      category: "💻 Tech & Data"
    },
    {
      question: "What's a geospatial analyst's favorite band?",
      answer: "Arcade Fire.",
      category: "💻 Tech & Data"
    },
    {
      question: "Why was the machine learning model bad at directions?",
      answer: "It kept overfitting the route.",
      category: "💻 Tech & Data"
    },
    {
      question: "Why did the cloud architect love geography?",
      answer: "Because everything is about regions.",
      category: "🤓 Mixed Tech + Geo"
    },
    {
      question: "Why don't GIS people ever fight about projections?",
      answer: "Because that argument would flatten the room.",
      category: "🤓 Mixed Tech + Geo"
    },
    {
      question: "Why did the open data cross the road?",
      answer: "To get to the public domain.",
      category: "🤓 Mixed Tech + Geo"
    },
    {
      question: "Why did the routing API get detention?",
      answer: "It kept taking shortcuts.",
      category: "🤓 Mixed Tech + Geo"
    },
    {
      question: "What's a location intelligence consultant's favorite pickup line?",
      answer: "\"You must be a POI—because I can't stop querying you.\"",
      category: "🤓 Mixed Tech + Geo"
    }
  ];

  useEffect(() => {
    if (!isVisible) {
      setShowInitialMessage(true);
      setCurrentJokeIndex(0);
      setShowAnswer(false);
      return;
    }

    // Show initial message for 4 seconds
    const initialTimer = setTimeout(() => {
      setShowInitialMessage(false);
    }, 4000);

    return () => clearTimeout(initialTimer);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || showInitialMessage) return;

    // Show question for 3 seconds, then answer for 3 seconds, then next joke
    const questionTimer = setTimeout(() => {
      setShowAnswer(true);
    }, 3000);

    const answerTimer = setTimeout(() => {
      setShowAnswer(false);
      setCurrentJokeIndex((prev) => (prev + 1) % jokes.length);
    }, 6000);

    return () => {
      clearTimeout(questionTimer);
      clearTimeout(answerTimer);
    };
  }, [isVisible, showInitialMessage, currentJokeIndex, jokes.length]);

  if (!isVisible) return null;

  const currentJoke = jokes[currentJokeIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/4 -right-8 w-32 h-32 bg-white bg-opacity-5 rounded-full animate-bounce"></div>
          <div className="absolute bottom-1/4 -left-6 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-28 h-28 bg-white bg-opacity-5 rounded-full animate-bounce"></div>
        </div>

        <div className="relative z-10">
          {showInitialMessage ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center space-x-4">
                <MapPin className="w-12 h-12 animate-bounce text-yellow-300" />
                <Zap className="w-12 h-12 animate-pulse text-yellow-300" />
                <Sparkles className="w-12 h-12 animate-bounce text-yellow-300" />
              </div>
              
              <h2 className="text-3xl font-bold text-center mb-4">
                Please be patient (it's free!)
              </h2>
              
              <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
                <p className="text-lg leading-relaxed">
                  It's simple physics! The more enrichment options you choose, 
                  the longer the real-time queries take!
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-yellow-300">
                <Clock className="w-5 h-5 animate-spin" />
                <span className="text-sm">
                  Processing {enrichmentCount} enrichment{enrichmentCount !== 1 ? 's' : ''}...
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 backdrop-blur-sm">
                  <MapPin className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm min-h-[200px] flex flex-col justify-center">
                <div className="mb-4">
                  <span className="inline-block bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-medium">
                    {currentJoke.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold mb-4 leading-relaxed">
                  {currentJoke.question}
                </h3>
                
                {showAnswer && (
                  <div className="animate-fadeIn">
                    <div className="border-t border-white border-opacity-30 pt-4">
                      <p className="text-lg font-medium text-yellow-200">
                        {currentJoke.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-2">
                {jokes.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      index === currentJokeIndex 
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
