import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8080/api";
const SESSION_KEY = "survivex-active-user";

const emptyPost = {
  title: "",
  story: "",
  survivalLesson: ""
};

const emptySignup = {
  username: "",
  displayName: "",
  bio: "",
  survivalFocus: "",
  password: ""
};

const emptyLogin = {
  username: "",
  password: ""
};

function App() {
  const [feed, setFeed] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [adminPendingPosts, setAdminPendingPosts] = useState([]);
  const [overview, setOverview] = useState({ members: 0, stories: 0, likes: 0, comments: 0 });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = window.localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [postForm, setPostForm] = useState(emptyPost);
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [authMode, setAuthMode] = useState("login");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const isAdmin = currentUser?.username === "admin";

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  async function loadData() {
    setIsLoading(true);
    setError("");

    try {
      const requests = [fetch(`${API_BASE}/feed`), fetch(`${API_BASE}/overview`)];

      if (currentUser) {
        requests.push(fetch(`${API_BASE}/users/${currentUser.id}/posts`));
      }

      if (currentUser && isAdmin) {
        requests.push(fetch(`${API_BASE}/admin/${currentUser.id}/pending-posts`));
      }

      const responses = await Promise.all(requests);
      const [feedResponse, overviewResponse, myPostsResponse, adminPendingResponse] = responses;

      ensureOk(feedResponse, "Failed to load the global feed.");
      ensureOk(overviewResponse, "Failed to load community overview.");
      if (myPostsResponse) {
        ensureOk(myPostsResponse, "Failed to load your submitted posts.");
      }
      if (adminPendingResponse) {
        ensureOk(adminPendingResponse, "Failed to load the admin approval queue.");
      }

      const [feedPayload, overviewPayload, myPostsPayload, adminPendingPayload] = await Promise.all([
        feedResponse.json(),
        overviewResponse.json(),
        myPostsResponse ? myPostsResponse.json() : Promise.resolve([]),
        adminPendingResponse ? adminPendingResponse.json() : Promise.resolve([])
      ]);

      setFeed(feedPayload);
      setOverview(overviewPayload);
      setMyPosts(myPostsPayload);
      setAdminPendingPosts(adminPendingPayload);
    } catch (loadError) {
      setError("Unable to reach the surviveX backend. Start Spring Boot on port 8080.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setError("");

    if (!isStrongPassword(signupForm.password)) {
      setError(
        "Password must be at least 6 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupForm)
      });
      ensureOk(response, "Unable to create the account.");

      const payload = await response.json();
      setCurrentUser(payload.user);
      setSignupForm(emptySignup);
      setAuthMessage(payload.message);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      ensureOk(response, "Login failed.");

      const payload = await response.json();
      setCurrentUser(payload.user);
      setLoginForm(emptyLogin);
      setAuthMessage(payload.message);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser.id,
          ...postForm
        })
      });
      ensureOk(response, "Unable to publish the story.");

      setAuthMessage(
        isAdmin
          ? "Admin post published directly to the public feed."
          : "Post submitted successfully. It is now waiting for admin approval."
      );
      setPostForm(emptyPost);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleApprovePost(postId) {
    if (!currentUser || !isAdmin) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: currentUser.id })
      });
      ensureOk(response, "Unable to approve the post.");
      setAuthMessage("Post approved and published to the public feed.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleToggleLike(postId) {
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      ensureOk(response, "Unable to update the like.");

      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleAddComment(event, postId) {
    event.preventDefault();
    if (!currentUser) {
      return;
    }

    const message = commentDrafts[postId]?.trim();
    if (!message) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser.id,
          message
        })
      });
      ensureOk(response, "Unable to add the comment.");

      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDeletePost(postId) {
    if (!currentUser) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: currentUser.id })
      });
      ensureOk(response, "Unable to delete the post.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDeleteComment(postId, commentId) {
    if (!currentUser) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this comment?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: currentUser.id })
      });
      ensureOk(response, "Unable to delete the comment.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setAuthMessage("");
    setError("");
  }

  if (!currentUser) {
    return (
      <div className="auth-shell">
        <div className="auth-spotlight" />
        <section className="auth-panel auth-panel--brand">
          <span className="eyebrow">Survival stories for everyone</span>
          <h1 className="brand-mark">
            survive<span>X</span>
          </h1>
          <p className="auth-copy">
            Enter a global network where people document the instincts, split-second choices, and
            hard-earned lessons that helped them stay alive.
          </p>
          <div className="feature-list">
            <div className="feature-chip">Blackout theme, red alert identity</div>
            <div className="feature-chip">Global text feed</div>
            <div className="feature-chip">Likes and comments</div>
            <div className="feature-chip">No follow walls</div>
          </div>
        </section>

        <section className="auth-panel auth-panel--form">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === "login" ? "auth-tab--active" : ""}`}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`auth-tab ${authMode === "signup" ? "auth-tab--active" : ""}`}
              onClick={() => setAuthMode("signup")}
              type="button"
            >
              Sign up
            </button>
          </div>

          {error ? <div className="banner banner--error">{error}</div> : null}
          {authMessage ? <div className="banner banner--success">{authMessage}</div> : null}

          {authMode === "login" ? (
            <form className="form" onSubmit={handleLogin}>
              <div className="panel__header">
                <h2>Welcome back</h2>
                <p>Login before entering the surviveX community feed.</p>
              </div>
              <input
                className="input"
                placeholder="Username"
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, username: event.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Password"
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
              />
              <button className="button" type="submit">
                Enter surviveX
              </button>
              <p className="helper-text">
                Demo users: `maya.river / maya123`, `arjun.storm / arjun123`, `admin / admin0211`
              </p>
            </form>
          ) : (
            <form className="form" onSubmit={handleSignup}>
              <div className="panel__header">
                <h2>Create your account</h2>
                <p>Join with your story, your instincts, and your survival focus.</p>
              </div>
              <input
                className="input"
                placeholder="Username"
                value={signupForm.username}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, username: event.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Display name"
                value={signupForm.displayName}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, displayName: event.target.value }))
                }
              />
              <textarea
                className="input input--textarea"
                placeholder="Short bio"
                value={signupForm.bio}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, bio: event.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Survival focus"
                value={signupForm.survivalFocus}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, survivalFocus: event.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Password"
                minLength="6"
                type="password"
                value={signupForm.password}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, password: event.target.value }))
                }
                title="Minimum 6 characters with 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
              />
              <p className="helper-text">
                Password must be at least 6 characters and include 1 uppercase letter, 1 lowercase
                letter, 1 number, and 1 special character.
              </p>
              <button className="button" type="submit">
                Create account
              </button>
            </form>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero__copy">
          <span className="eyebrow">Global survival story feed</span>
          <h1 className="brand-mark">
            survive<span>X</span>
          </h1>
          <p>
            Every survivor story is public to the community so life-saving instincts can spread
            faster than panic.
          </p>
        </div>
        <div className="hero__stats">
          <StatCard label="Members" value={overview.members} />
          <StatCard label="Stories" value={overview.stories} />
          <StatCard label="Likes" value={overview.likes} />
          <StatCard label="Comments" value={overview.comments} />
        </div>
      </header>

      {error ? <div className="banner banner--error">{error}</div> : null}
      {authMessage ? <div className="banner banner--success">{authMessage}</div> : null}

      <main className="layout">
        <aside className="sidebar">
          <section className="panel">
            <div className="panel__header">
              <h2>Signed in</h2>
              <p>You are posting as your authenticated surviveX account.</p>
            </div>
            <div className="active-user active-user--dark">
              <strong>{currentUser.displayName}</strong>
              <span>@{currentUser.username}</span>
              <p>{currentUser.bio}</p>
              <small>Focus: {currentUser.survivalFocus}</small>
            </div>
            <button className="button button--ghost" onClick={handleLogout} type="button">
              Logout
            </button>
          </section>

          <section className="panel panel--hint">
            <div className="panel__header">
              <h2>{isAdmin ? "Admin panel" : "surviveX mission"}</h2>
              <p>
                {isAdmin
                  ? "Approve pending community stories here before they appear in the public feed."
                  : "This platform is built to help people remember what action, instinct, or calm decision made the difference when survival was on the line."}
              </p>
            </div>
          </section>
        </aside>

        <section className="content">
          <section className="panel panel--composer">
            <div className="panel__header">
              <h2>Share a survival story</h2>
              <p>Describe the danger, the turning point, and the instinct that saved you.</p>
            </div>
            <form className="form" onSubmit={handleCreatePost}>
              <input
                className="input"
                placeholder="Post title"
                value={postForm.title}
                onChange={(event) =>
                  setPostForm((current) => ({ ...current, title: event.target.value }))
                }
              />
              <textarea
                className="input input--textarea input--story"
                placeholder="Tell the full survival story"
                value={postForm.story}
                onChange={(event) =>
                  setPostForm((current) => ({ ...current, story: event.target.value }))
                }
              />
              <textarea
                className="input input--textarea"
                placeholder="What life instinct or lesson saved you?"
                value={postForm.survivalLesson}
                onChange={(event) =>
                  setPostForm((current) => ({ ...current, survivalLesson: event.target.value }))
                }
              />
              <button className="button" type="submit">
                {isAdmin ? "Publish to global feed" : "Send for admin approval"}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>My submissions</h2>
              <p>Track which stories are pending and which are already approved.</p>
            </div>
            <div className="submission-list">
              {myPosts.length === 0 ? <p className="muted">No posts submitted yet.</p> : null}
              {myPosts.map((post) => (
                <div key={post.id} className="submission-card">
                  <div className="submission-card__header">
                    <strong>{post.title}</strong>
                    <span className={`status-pill status-pill--${post.status.toLowerCase()}`}>
                      {post.status}
                    </span>
                  </div>
                  <p>{post.story}</p>
                </div>
              ))}
            </div>
          </section>

          {isAdmin ? (
            <section className="panel">
              <div className="panel__header">
                <h2>Pending approval</h2>
                <p>Review these posts and approve the ones that should go public.</p>
              </div>
              <div className="submission-list">
                {adminPendingPosts.length === 0 ? (
                  <p className="muted">No pending posts waiting for approval.</p>
                ) : null}
                {adminPendingPosts.map((post) => (
                  <div key={post.id} className="submission-card">
                    <div className="submission-card__header">
                      <div>
                        <strong>{post.title}</strong>
                        <p className="helper-text">
                          {post.authorName} {post.authorHandle}
                        </p>
                      </div>
                      <button
                        className="button button--approve"
                        onClick={() => handleApprovePost(post.id)}
                        type="button"
                      >
                        Approve
                      </button>
                    </div>
                    <p>{post.story}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="feed">
            <div className="feed__header">
              <h2>Community feed</h2>
              <p>No follow system. Every member learns from the same stream of survival stories.</p>
            </div>

            {isLoading ? <div className="panel">Loading surviveX...</div> : null}

            {feed.map((post) => {
              const hasLiked = currentUser ? post.likedUserIds.includes(currentUser.id) : false;

              return (
                <article key={post.id} className="card">
                  <div className="card__meta">
                    <div>
                      <h3>{post.title}</h3>
                      <p>
                        {post.authorName} <span>{post.authorHandle}</span>
                      </p>
                    </div>
                    <div className="card__actions">
                      <small>{new Date(post.createdAt).toLocaleString()}</small>
                      {currentUser.id === post.authorId ? (
                        <button
                          aria-label="Delete post"
                          className="icon-button icon-button--danger"
                          onClick={() => handleDeletePost(post.id)}
                          type="button"
                          title="Delete post"
                        >
                          <TrashIcon />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <p className="card__story">{post.story}</p>

                  <div className="lesson">
                    <span>Instinct that mattered</span>
                    <p>{post.survivalLesson}</p>
                  </div>

                  <div className="engagement">
                    <button className="button button--ghost" onClick={() => handleToggleLike(post.id)}>
                      {hasLiked ? "Unlike" : "Like"} ({post.likedUserIds.length})
                    </button>
                    <span>{post.comments.length} comments</span>
                  </div>

                  <div className="comments">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="comment">
                        <div className="comment__meta">
                          <strong>{comment.authorName}</strong>
                          {currentUser.id === comment.authorId ? (
                            <button
                              aria-label="Delete comment"
                              className="icon-button icon-button--danger"
                              onClick={() => handleDeleteComment(post.id, comment.id)}
                              type="button"
                              title="Delete comment"
                            >
                              <TrashIcon />
                            </button>
                          ) : null}
                        </div>
                        <p>{comment.message}</p>
                      </div>
                    ))}
                  </div>

                  <form className="comment-form" onSubmit={(event) => handleAddComment(event, post.id)}>
                    <input
                      className="input"
                      placeholder="Add a comment"
                      value={commentDrafts[post.id] ?? ""}
                      onChange={(event) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [post.id]: event.target.value
                        }))
                      }
                    />
                    <button className="button button--secondary" type="submit">
                      Reply
                    </button>
                  </form>
                </article>
              );
            })}
          </section>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="icon-button__icon" viewBox="0 0 24 24">
      <path
        d="M9 3.75h6l.6 1.25H19.5a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1 0-1.5h3.9L9 3.75Zm-1.25 5.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V10a.75.75 0 0 1 .75-.75Zm4.25 0a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V10a.75.75 0 0 1 .75-.75Zm4.25 0A.75.75 0 0 1 17 10v7.5a.75.75 0 0 1-1.5 0V10a.75.75 0 0 1 .75-.75ZM6.75 7h10.5l-.72 11.12A2.25 2.25 0 0 1 14.29 20H9.71a2.25 2.25 0 0 1-2.24-1.88L6.75 7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ensureOk(response, fallbackMessage) {
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/.test(password);
}

export default App;
