import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { getDocs, query, collection, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Votes from "./components/Votes";

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to sign up page if no user logged in
        if (!auth.currentUser) {
            navigate("/signup");
        }
        // Redirect to set username page if user logged in without reddit username
        else if (auth.currentUser && !auth.currentUser.displayName) {
            navigate("/signup/setusername");
        }
    }, [navigate]);

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        async function retrievePosts() {
            const loadedPosts = [];
            const subredditSnapshot = await getDocs(
                collection(db, "subreddits")
            );
            const subredditArr = [];
            subredditSnapshot.forEach(subreddit =>
                subredditArr.push(subreddit.id)
            );
            for (const subreddit of subredditArr) {
                const q = query(
                    collection(db, `subreddits/${subreddit}/posts`),
                    orderBy("timeCreated", "desc")
                );
                const postsSnapshot = await getDocs(q);
                postsSnapshot.forEach(post => {
                    loadedPosts.push(post.data());
                });
            }
            return loadedPosts;
        }
        retrievePosts().then(retrievedPosts => {
            setPosts(retrievedPosts);
        });
    }, []);

    const [upvoted, setUpvoted] = useState(false);
    const [downvoted, setDownvoted] = useState(false);

    return (
        <div className="App">
            <h1>
                Hello {auth.currentUser && `u/${auth.currentUser.displayName}`}
            </h1>
            <button
                onClick={async () => {
                    await signOut(auth);
                    navigate("/login");
                }}
            >
                Sign Out
            </button>
            <main className="m-6">
                {posts.map((post, index) => (
                    <div
                        className="flex border border-gray-300 hover:border-gray-500 rounded m-auto max-w-[1000px] bg-white my-3 p-2 hover:cursor-pointer"
                        key={index}
                    >
                        <Votes
                            votes={post.votes}
                            upvote={() => setUpvoted(!upvoted)}
                            upvoted={upvoted}
                            downvote={() => setDownvoted(!downvoted)}
                            downvoted={downvoted}
                        />
                        <div className="flex-1 flex flex-col ml-4">
                            <div className="flex text-xs items-center gap-1 mb-1">
                                <h4 className="font-bold">{`r/${post.subreddit}`}</h4>
                                <p className="text-gray-500">
                                    •{console.log(post.timeCreated)}
                                </p>
                                <p className="text-gray-500">{`Posted by u/${post.author.displayName}`}</p>
                            </div>
                            <h2 className="font-bold text-lg">{post.title}</h2>
                            <div className="self-center w-full">
                                {post.type === "text" && <p>{post.body}</p>}
                                {(post.type === "image" ||
                                    post.type === "video") && (
                                    <img
                                        src={post.src}
                                        alt="User uploaded"
                                        className="max-h-[600px] object-contain m-auto"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
}

export default App;
