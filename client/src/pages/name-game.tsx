import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Friend } from "@shared/schema";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface GameState {
  currentFriend: Friend | null;
  options: string[];
  score: number;
  totalQuestions: number;
  currentQuestion: number;
  gameComplete: boolean;
  correctAnswers: number;
}

export default function NameGame() {
  const [, setLocation] = useLocation();
  const [gameState, setGameState] = useState<GameState>({
    currentFriend: null,
    options: [],
    score: 0,
    totalQuestions: 10,
    currentQuestion: 0,
    gameComplete: false,
    correctAnswers: 0,
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  // Filter friends that have photos for the game
  const friendsWithPhotos = friends.filter(friend => friend.photo);

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateQuestion = () => {
    if (friendsWithPhotos.length < 4) return null;

    const correctFriend = friendsWithPhotos[Math.floor(Math.random() * friendsWithPhotos.length)];
    const wrongOptions = shuffleArray(
      friendsWithPhotos.filter(f => f.id !== correctFriend.id)
    ).slice(0, 3);
    
    const allOptions = shuffleArray([
      `${correctFriend.firstName} ${correctFriend.lastName || ''}`.trim(), 
      ...wrongOptions.map(f => `${f.firstName} ${f.lastName || ''}`.trim())
    ]);

    return {
      currentFriend: correctFriend,
      options: allOptions,
    };
  };

  const startNewGame = () => {
    const question = generateQuestion();
    if (!question) return;

    setGameState({
      currentFriend: question.currentFriend,
      options: question.options,
      score: 0,
      totalQuestions: Math.min(10, friendsWithPhotos.length),
      currentQuestion: 1,
      gameComplete: false,
      correctAnswers: 0,
    });
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer || !gameState.currentFriend) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === `${gameState.currentFriend.firstName} ${gameState.currentFriend.lastName || ''}`.trim();
    
    setTimeout(() => {
      setGameState(prev => {
        const newCorrectAnswers = prev.correctAnswers + (isCorrect ? 1 : 0);
        const newScore = prev.score + (isCorrect ? 10 : 0);
        const nextQuestion = prev.currentQuestion + 1;
        
        if (nextQuestion > prev.totalQuestions) {
          return {
            ...prev,
            score: newScore,
            correctAnswers: newCorrectAnswers,
            gameComplete: true,
          };
        }

        const nextQuestionData = generateQuestion();
        if (!nextQuestionData) {
          return {
            ...prev,
            score: newScore,
            correctAnswers: newCorrectAnswers,
            gameComplete: true,
          };
        }

        return {
          ...prev,
          currentFriend: nextQuestionData.currentFriend,
          options: nextQuestionData.options,
          score: newScore,
          correctAnswers: newCorrectAnswers,
          currentQuestion: nextQuestion,
        };
      });
      
      setSelectedAnswer(null);
      setShowResult(false);
    }, 1500);
  };

  useEffect(() => {
    if (friendsWithPhotos.length >= 4) {
      startNewGame();
    }
  }, [friendsWithPhotos.length]);

  if (friendsWithPhotos.length < 4) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        <div className="gradient-bg px-6 pt-12 pb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setLocation("/")}
              className="p-2 bg-white/20 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Name Game</h1>
            <div className="w-10"></div>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64 px-6">
          <div className="text-center">
            <div className="text-gray-500 mb-2">Not enough friends with photos</div>
            <p className="text-sm text-gray-400">Add at least 4 friends with photos to play the name game</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (gameState.gameComplete) {
    const percentage = Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100);
    
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        <div className="gradient-bg px-6 pt-12 pb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setLocation("/")}
              className="p-2 bg-white/20 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Game Complete!</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="px-6 -mt-2 pb-24">
          <Card className="relative z-10">
            <CardContent className="p-8 text-center">
              <Trophy size={64} className="mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold text-dark-gray mb-2">Great Job!</h2>
              <p className="text-gray-600 mb-4">You completed the name game</p>
              
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <div className="text-3xl font-bold text-coral mb-2">{percentage}%</div>
                <div className="text-sm text-gray-600 mb-4">Accuracy Score</div>
                <div className="text-lg font-semibold text-dark-gray mb-1">
                  {gameState.correctAnswers} / {gameState.totalQuestions}
                </div>
                <div className="text-sm text-gray-500">Correct Answers</div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={startNewGame}
                  className="w-full bg-coral hover:bg-coral/90"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Play Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header */}
      <div className="gradient-bg px-6 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setLocation("/")}
            className="p-2 bg-white/20 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Name Game</h1>
          <button 
            onClick={startNewGame}
            className="p-2 bg-white/20 rounded-full"
          >
            <RotateCcw size={20} />
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-white/80 text-sm">
            Question {gameState.currentQuestion} of {gameState.totalQuestions}
          </div>
          <div className="text-white/80 text-sm">
            Score: {gameState.score}
          </div>
        </div>

        <Progress 
          value={(gameState.currentQuestion - 1) / gameState.totalQuestions * 100} 
          className="h-2 bg-white/20"
        />
      </div>

      {/* Game Content */}
      <div className="px-6 -mt-2 pb-24">
        {gameState.currentFriend && (
          <Card className="relative z-10">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-dark-gray mb-4">
                  Who is this?
                </h2>
                
                {/* Friend Photo */}
                <div className="w-48 h-48 mx-auto rounded-3xl overflow-hidden bg-gray-200 mb-6">
                  <img 
                    src={gameState.currentFriend.photo!} 
                    alt="Guess this friend" 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {gameState.options.map((option, index) => {
                    let buttonClass = "w-full p-4 text-left rounded-2xl border-2 transition-all duration-200 ";
                    
                    if (showResult) {
                      if (option === `${gameState.currentFriend!.firstName} ${gameState.currentFriend!.lastName || ''}`.trim()) {
                        buttonClass += "bg-green-100 border-green-500 text-green-700";
                      } else if (option === selectedAnswer) {
                        buttonClass += "bg-red-100 border-red-500 text-red-700";
                      } else {
                        buttonClass += "bg-gray-100 border-gray-300 text-gray-500";
                      }
                    } else if (selectedAnswer === option) {
                      buttonClass += "bg-coral/10 border-coral text-coral";
                    } else {
                      buttonClass += "bg-white border-gray-200 text-dark-gray hover:bg-gray-50";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        disabled={selectedAnswer !== null}
                        className={buttonClass}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {showResult && (
                  <div className="mt-4 p-4 rounded-2xl bg-gray-50">
                    <p className="text-sm text-gray-600">
                      {selectedAnswer === `${gameState.currentFriend.firstName} ${gameState.currentFriend.lastName || ''}`.trim() ? (
                        <span className="text-green-600 font-medium">Correct! 🎉</span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          Wrong! The correct answer is {`${gameState.currentFriend.firstName} ${gameState.currentFriend.lastName || ''}`.trim()}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
