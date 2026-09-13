import { MapPin, Trophy, Calendar, Settings, ThumbsUp, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { GameCard, type Game } from "./game-card";
import { PlayerCard, type Player } from "./player-card";
import { Textarea } from "./ui/textarea";
import { useState } from "react";




interface ProfileViewProps {
  isOwnProfile?: boolean;
  player: Player & {
    gamesAttended: Game[];
    followers: Player[];
    following: Player[];
    achievements: Array<{ title: string; icon: string; date: string }>;

    reviews?: {
      id: string;
      reviewerName: string;
      reviewerAvatar?: string;
      rating: number;
      comment: string;
      date: string;
      helpfulCount: number;
    }[];

    stats: {
      winRate: number;
      hoursPlayed: number;
      favoritePosition: string;
      memberSince: string;
    };
  };
  onEditProfile?: () => void;
  onConnect?: (playerId: string) => void;
}

export function ProfileView({ isOwnProfile = false, player, onEditProfile, onConnect }: ProfileViewProps) {
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);

  const handleSubmitReview = () => {
    console.log("Submitting review:", { rating: newRating, comment: newReview });
    setNewReview("");
    setNewRating(5);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="relative overflow-hidden border border-border bg-card">
        {/* Cover Banner */}
        <div className="h-48 bg-primary relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1750790626700-0b2d3d4472a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2xsZXliYWxsJTIwcGxheWVycyUyMGJlYWNofGVufDF8fHx8MTc2NzY2MjU2N3ww&ixlib=rb-4.1.0&q=80&w=1080')] opacity-10 bg-cover bg-center" />
        </div>

        <div className="px-8 pb-8 relative">
          {/* Avatar positioned over banner */}
          <div className="flex justify-between items-start -mt-16 mb-4">
            <Avatar className="h-32 w-32 border-4 border-card shadow-xl bg-card">
              <AvatarImage src={player.avatar} alt={player.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {player.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            
            {/* Action Buttons - Desktop */}
            <div className="hidden md:flex gap-2 mt-4">
              {isOwnProfile ? (
                <>
                  <Button
                    onClick={onEditProfile}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="icon" className="border-border">
                    <Settings className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => onConnect?.(player.id)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {player.isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline" className="border-border">
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl mb-2 text-foreground">{player.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{player.location}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {player.stats.memberSince}</span>
                </div>
              </div>
              <Badge variant="outline" className={
                player.skillLevel === "Advanced" ? "bg-danger/10 text-danger border-danger/20" :
                player.skillLevel === "Intermediate" ? "bg-warning/10 text-warning border-warning/20" :
                "bg-success/10 text-success border-success/20"
              }>
                {player.skillLevel}
              </Badge>
            </div>

            {player.bio && (
              <p className="text-muted-foreground max-w-2xl">{player.bio}</p>
            )}

            {/* Action Buttons - Mobile */}
            <div className="flex md:hidden gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    onClick={onEditProfile}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="icon" className="border-border">
                    <Settings className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => onConnect?.(player.id)}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {player.isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline" className="flex-1 border-border">
                    Message
                  </Button>
                </>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-medium mb-1">{player.gamesPlayed}</div>
                <div className="text-sm text-muted-foreground">Games Played</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-medium mb-1">{player.rating.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-medium mb-1">{player.stats.hoursPlayed}</div>
                <div className="text-sm text-muted-foreground">Hours</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50">
        <TabsTrigger value="games">Games</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl mb-4">Recent Games</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {player.gamesAttended.slice(0, 6).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isJoined={true}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6 mt-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl">Player Reviews</h2>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="text-xl">{player.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({player.reviews?.length || 0})
                </span>
              </div>
            </div>

            {!isOwnProfile && (
              <Card className="p-6 mb-6">
                <h3 className="mb-4">Leave a Review</h3>

                {/* Rating */}
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setNewRating(star)}>
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Text */}
                <Textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Write a review..."
                />

                <Button
                  onClick={handleSubmitReview}
                  disabled={!newReview.trim()}
                  className="mt-3"
                >
                  Submit Review
                </Button>
              </Card>
            )}

            {/* Review List */}
            <div className="space-y-4">
              {player.reviews?.length ? (
                player.reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex justify-between">
                      <h4>{review.reviewerName}</h4>
                      <span className="text-sm text-muted-foreground">
                        {review.date}
                      </span>
                    </div>

                    <div className="flex gap-1 my-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-muted-foreground">{review.comment}</p>

                    <Button variant="ghost" size="sm" className="mt-2">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {review.helpfulCount}
                    </Button>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">No reviews yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl mb-4">Achievements</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {player.achievements.map((achievement, index) => (
                <Card key={index} className="p-6 border border-border hover:border-primary/50 transition-all bg-card cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-warning/10">
                      <Trophy className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-1">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.date}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Followers Tab */}
        <TabsContent value="followers" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl mb-4">Followers ({player.followers.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {player.followers.map((follower) => (
                <PlayerCard
                  key={follower.id}
                  player={follower}
                  onConnect={onConnect}
                  compact
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl mb-4">Following ({player.following.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {player.following.map((following) => (
                <PlayerCard
                  key={following.id}
                  player={following}
                  onConnect={onConnect}
                  compact
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
