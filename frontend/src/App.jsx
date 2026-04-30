import { useEffect, useRef, useState } from "react";

const APP_HOST = typeof window !== "undefined" ? window.location.hostname || "localhost" : "localhost";
const IS_LOCAL_HOST = APP_HOST === "localhost" || APP_HOST === "127.0.0.1";
const DEFAULT_API_BASE = IS_LOCAL_HOST ? `http://${APP_HOST}:8080/api` : "https://api.survivex.in/api";
const DEFAULT_UNITY_WEBGL_URL = IS_LOCAL_HOST ? `http://${APP_HOST}:8080/unity` : "https://api.survivex.in/unity";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
const UNITY_WEBGL_URL = import.meta.env.VITE_UNITY_WEBGL_URL || DEFAULT_UNITY_WEBGL_URL;
const SESSION_KEY = "survivex-active-user";
const SAVED_POSTS_KEY = "survivex-saved-posts";
const DO_OR_DIE_STREAKS_KEY = "survivex-do-or-die-streaks";
const THEME_KEY = "survivex-theme";
const INTRO_KEY = "survivex-intro-played";
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const HERO_MESSAGES = [
  "DO or DIE",
  "Instincts are the real decisions to stay alive",
  "Stay Alert",
  "Every second chooses the survivor"
];

const emptyPost = {
  title: "",
  story: "",
  survivalLesson: "",
  imageUrl: ""
};

const emptySignup = {
  email: "",
  fullName: "",
  username: "",
  bio: "",
  survivalFocus: "",
  profilePhotoUrl: "",
  coverImageUrl: "",
  password: "",
  confirmPassword: ""
};

const emptyLogin = {
  username: "",
  password: ""
};

const emptyAboutPage = {
  title: "Our Team",
  teamPhotoUrl: "",
  teamStory: "",
  members: [
    { name: "Siddharth Rawal", photoUrl: "", description: "" },
    { name: "Adish Sharma", photoUrl: "", description: "" },
    { name: "Aman Bharawa", photoUrl: "", description: "" },
    { name: "Arin Arya", photoUrl: "", description: "" }
  ]
};

function App() {
  const [feed, setFeed] = useState([]);
  const [users, setUsers] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [overview, setOverview] = useState({ members: 0, stories: 0, likes: 0, comments: 0 });
  const [savedPostIds, setSavedPostIds] = useState(() => {
    const saved = window.localStorage.getItem(SAVED_POSTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = window.localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [postForm, setPostForm] = useState(emptyPost);
  const [editingPostId, setEditingPostId] = useState(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [signupFieldErrors, setSignupFieldErrors] = useState({});
  const [signupUsernameStatus, setSignupUsernameStatus] = useState({
    state: "idle",
    message: "Username must be at least 4 characters."
  });
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [authMode, setAuthMode] = useState("login");
  const [signupStep, setSignupStep] = useState(1);
  const [signupMethod, setSignupMethod] = useState("standard");
  const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false);
  const [isGoogleSignupPending, setIsGoogleSignupPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
  const [error, setError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [typedText, setTypedText] = useState("");
  const [mediaModal, setMediaModal] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [viewedProfilePosts, setViewedProfilePosts] = useState([]);
  const [isLoadingViewedProfile, setIsLoadingViewedProfile] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [aboutPage, setAboutPage] = useState(emptyAboutPage);
  const [aboutForm, setAboutForm] = useState(emptyAboutPage);
  const [pageView, setPageView] = useState(() => {
    if (window.location.hash === "#about") {
      return "about";
    }
    if (window.location.hash === "#profile") {
      return "profile";
    }
    return "home";
  });
  const [uploadingAboutKey, setUploadingAboutKey] = useState("");
  const [isEditingProfileDetails, setIsEditingProfileDetails] = useState(false);
  const [profileDetailsForm, setProfileDetailsForm] = useState({ bio: "", survivalFocus: "" });
  const [openSidebarSections, setOpenSidebarSections] = useState({
    published: false,
    status: false
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => window.localStorage.getItem(THEME_KEY) || "dark");
  const [showIntro, setShowIntro] = useState(() => window.sessionStorage.getItem(INTRO_KEY) !== "true");
  const [activeSpeechField, setActiveSpeechField] = useState("");
  const [activeNarrationPostId, setActiveNarrationPostId] = useState(null);
  const [loadingNarrationPostId, setLoadingNarrationPostId] = useState(null);
  const [doOrDieStreak, setDoOrDieStreak] = useState({ count: 0, lastUsedAt: "" });
  const isAdmin = currentUser?.username === "admin";
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const aboutPageRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechBaseValueRef = useRef("");
  const narrationAudioRef = useRef(null);
  const narrationAudioUrlRef = useRef("");
  const googleSignupButtonRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!showIntro) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.sessionStorage.setItem(INTRO_KEY, "true");
      setShowIntro(false);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [showIntro]);

  useEffect(() => {
    window.localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(savedPostIds));
  }, [savedPostIds]);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    function syncPageFromHash() {
      if (window.location.hash === "#about") {
        setPageView("about");
      } else if (window.location.hash === "#profile") {
        setPageView("profile");
      } else {
        setPageView("home");
      }
    }

    window.addEventListener("hashchange", syncPageFromHash);
    syncPageFromHash();
    return () => window.removeEventListener("hashchange", syncPageFromHash);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setProfileDetailsForm({
      bio: currentUser.bio || "",
      survivalFocus: currentUser.survivalFocus || ""
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setDoOrDieStreak({ count: 0, lastUsedAt: "" });
      return;
    }

    setDoOrDieStreak(readDoOrDieStreak(currentUser.id));
  }, [currentUser]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    if (window.google?.accounts?.id) {
      setIsGoogleScriptReady(true);
      return;
    }

    const existingScript = document.querySelector('script[data-google-signin="true"]');
    if (existingScript) {
      const handleLoad = () => setIsGoogleScriptReady(true);
      existingScript.addEventListener("load", handleLoad);
      return () => existingScript.removeEventListener("load", handleLoad);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleSignin = "true";
    script.onload = () => setIsGoogleScriptReady(true);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, []);

  useEffect(() => {
    if (
      !GOOGLE_CLIENT_ID ||
      !isGoogleScriptReady ||
      authMode !== "signup" ||
      signupStep !== 1 ||
      !googleSignupButtonRef.current ||
      !window.google?.accounts?.id
    ) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleSignupCredential
    });

    googleSignupButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleSignupButtonRef.current, {
      theme: theme === "light" ? "outline" : "filled_black",
      size: "large",
      text: "signup_with",
      shape: "pill",
      width: googleSignupButtonRef.current.offsetWidth || 320
    });
  }, [authMode, signupStep, isGoogleScriptReady, theme]);

  useEffect(() => {
    if (authMode !== "signup" || signupStep !== 2) {
      return;
    }

    const username = signupForm.username.trim();
    if (!username) {
      setSignupUsernameStatus({
        state: "idle",
        message: "Username must be at least 4 characters."
      });
      return;
    }

    if (username.length < 4) {
      setSignupUsernameStatus({
        state: "invalid",
        message: "Username must be at least 4 characters."
      });
      return;
    }

    setSignupUsernameStatus({
      state: "checking",
      message: "Checking username availability..."
    });

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE}/auth/username-availability?username=${encodeURIComponent(username)}`
        );
        await ensureOk(response, "Unable to check username availability.");
        const payload = await response.json();
        setSignupUsernameStatus(
          payload.available
            ? { state: "available", message: "Username is available." }
            : { state: "unavailable", message: "Username is already taken." }
        );
      } catch (requestError) {
        setSignupUsernameStatus({
          state: "idle",
          message: "Could not verify username right now."
        });
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [authMode, signupForm.username, signupStep]);

  useEffect(() => {
    if (pageView !== "about" || !aboutPageRef.current) {
      return;
    }

    const revealItems = aboutPageRef.current.querySelectorAll("[data-reveal]");
    if (revealItems.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -12% 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [pageView, aboutPage]);

  useEffect(() => {
    let messageIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId;

    function tick() {
      const currentMessage = HERO_MESSAGES[messageIndex];

      if (!deleting) {
        charIndex += 1;
        setTypedText(currentMessage.slice(0, charIndex));
        if (charIndex === currentMessage.length) {
          deleting = true;
          timeoutId = window.setTimeout(tick, 1300);
          return;
        }
      } else {
        charIndex -= 1;
        setTypedText(currentMessage.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          messageIndex = (messageIndex + 1) % HERO_MESSAGES.length;
        }
      }

      timeoutId = window.setTimeout(tick, deleting ? 35 : 70);
    }

    tick();
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
        narrationAudioRef.current = null;
      }
      if (narrationAudioUrlRef.current) {
        URL.revokeObjectURL(narrationAudioUrlRef.current);
        narrationAudioUrlRef.current = "";
      }
    };
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError("");

    try {
      const requests = [
        fetch(`${API_BASE}/feed`),
        fetch(`${API_BASE}/overview`),
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/about`)
      ];

      if (currentUser) {
        requests.push(fetch(`${API_BASE}/users/${currentUser.id}/posts`));
      }

      const responses = await Promise.all(requests);
      const [feedResponse, overviewResponse, usersResponse, aboutResponse, myPostsResponse] = responses;

      await ensureOk(feedResponse, "Failed to load the global feed.");
      await ensureOk(overviewResponse, "Failed to load community overview.");
      await ensureOk(usersResponse, "Failed to load users.");
      await ensureOk(aboutResponse, "Failed to load About Us.");
      if (myPostsResponse) {
        await ensureOk(myPostsResponse, "Failed to load your posts.");
      }

      const [feedPayload, overviewPayload, usersPayload, aboutPayload, myPostsPayload] = await Promise.all([
        feedResponse.json(),
        overviewResponse.json(),
        usersResponse.json(),
        aboutResponse.json(),
        myPostsResponse ? myPostsResponse.json() : Promise.resolve([])
      ]);

      setFeed(feedPayload);
      setOverview(overviewPayload);
      setUsers(usersPayload);
      setAboutPage(aboutPayload);
      setAboutForm(aboutPayload);
      setMyPosts(myPostsPayload);
    } catch (loadError) {
      setError("Unable to reach the surviveX backend. Start Spring Boot on port 8080.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setError("");
    const nextFieldErrors = {};

    if (!signupForm.email.trim()) {
      nextFieldErrors.email = "Email is required.";
    }
    if (!signupForm.fullName.trim()) {
      nextFieldErrors.fullName = "Full name is required.";
    }
    if (!signupForm.username.trim()) {
      nextFieldErrors.username = "Username is required.";
    }
    if (!signupForm.password.trim()) {
      nextFieldErrors.password = "Password is required.";
    }
    if (!signupForm.confirmPassword.trim()) {
      nextFieldErrors.confirmPassword = "Confirm password is required.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setSignupFieldErrors(nextFieldErrors);
      setError("Mandatory fields are required.");
      return;
    }

    if (signupForm.username.trim().length < 4) {
      setSignupFieldErrors((current) => ({ ...current, username: "Username must be at least 4 characters long." }));
      setError("Username must be at least 4 characters long.");
      return;
    }

    if (signupUsernameStatus.state === "unavailable") {
      setSignupFieldErrors((current) => ({ ...current, username: "That username is already taken." }));
      setError("That username is already taken.");
      return;
    }

    if (!isStrongPassword(signupForm.password)) {
      setSignupFieldErrors((current) => ({
        ...current,
        password:
          "Password must be at least 6 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
      }));
      setError(
        "Password must be at least 6 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
      );
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupFieldErrors((current) => ({
        ...current,
        confirmPassword: "Passwords do not match."
      }));
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupForm.email,
          username: signupForm.username,
          displayName: signupForm.fullName,
          bio: signupForm.bio,
          survivalFocus: signupForm.survivalFocus,
          profilePhotoUrl: signupForm.profilePhotoUrl,
          coverImageUrl: signupForm.coverImageUrl,
          password: signupForm.password
        })
      });
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok) {
        if (payload?.fieldErrors) {
          setSignupFieldErrors(payload.fieldErrors);
        }
        throw new Error(payload?.message || "Unable to create the account.");
      }

      setSignupFieldErrors({});
      setCurrentUser(payload.user);
      window.location.hash = "#home";
      setSignupForm(emptySignup);
      setSignupStep(1);
      setAuthMessage(payload.message);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleAdvanceSignupStep() {
    const nextFieldErrors = {};
    const normalizedEmail = signupForm.email.trim();

    if (!normalizedEmail) {
      nextFieldErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextFieldErrors.email = "Enter a valid email address.";
    }

    if (!signupForm.fullName.trim()) {
      nextFieldErrors.fullName = "Full name is required.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setSignupFieldErrors((current) => ({ ...current, ...nextFieldErrors }));
      setError("Mandatory fields are required.");
      return;
    }

    setSignupFieldErrors((current) => {
      const next = { ...current };
      delete next.email;
      delete next.fullName;
      return next;
    });
    setError("");
    setSignupStep(2);
  }

  function handleGoogleSignupCredential(response) {
    try {
      setIsGoogleSignupPending(true);
      const credentialPayload = decodeGoogleCredential(response?.credential);
      if (!credentialPayload?.email || !credentialPayload?.name) {
        throw new Error("Unable to read your Gmail profile.");
      }

      setSignupForm((current) => ({
        ...current,
        email: credentialPayload.email,
        fullName: credentialPayload.name,
        bio: "",
        survivalFocus: ""
      }));
      setSignupMethod("google");
      setSignupFieldErrors((current) => {
        const next = { ...current };
        delete next.email;
        delete next.fullName;
        return next;
      });
      setError("");
      setSignupStep(2);
    } catch (credentialError) {
      setError(credentialError.message || "Unable to continue with Gmail.");
    } finally {
      setIsGoogleSignupPending(false);
    }
  }

  function decodeGoogleCredential(credential) {
    if (!credential) {
      throw new Error("No Gmail credential was returned.");
    }

    const payload = credential.split(".")[1];
    if (!payload) {
      throw new Error("Invalid Gmail credential.");
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    return JSON.parse(decoded);
  }

  async function uploadImage(file, folder) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch(`${API_BASE}/uploads/image`, {
      method: "POST",
      body: formData
    });
    await ensureOk(response, "Image upload failed.");
    const payload = await response.json();
    return payload.imageUrl;
  }

  async function handleProfileImageSelected(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setIsUploadingProfile(true);
    try {
      const imageUrl = await uploadImage(file, "profiles");
      setSignupForm((current) => ({ ...current, profilePhotoUrl: imageUrl }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsUploadingProfile(false);
      event.target.value = "";
    }
  }

  async function handleCoverImageSelected(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setIsUploadingCover(true);
    try {
      const imageUrl = await uploadImage(file, "covers");
      setSignupForm((current) => ({ ...current, coverImageUrl: imageUrl }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsUploadingCover(false);
      event.target.value = "";
    }
  }

  async function handlePostImageSelected(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setIsUploadingPostImage(true);
    try {
      const imageUrl = await uploadImage(file, "posts");
      setPostForm((current) => ({ ...current, imageUrl }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsUploadingPostImage(false);
      event.target.value = "";
    }
  }

  async function updateProfileMedia(updates) {
    if (!currentUser) {
      return;
    }

    const response = await fetch(`${API_BASE}/users/${currentUser.id}/profile-media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profilePhotoUrl: updates.profilePhotoUrl ?? currentUser.profilePhotoUrl,
        coverImageUrl: updates.coverImageUrl ?? currentUser.coverImageUrl
      })
    });
    await ensureOk(response, "Unable to save profile images.");
    const updatedUser = await response.json();
    setCurrentUser(updatedUser);
    setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    setAuthMessage("Profile images updated.");
  }

  async function handleProfileAvatarSelected(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setIsUploadingProfile(true);
    try {
      const imageUrl = await uploadImage(file, "profiles");
      await updateProfileMedia({ profilePhotoUrl: imageUrl });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsUploadingProfile(false);
      event.target.value = "";
    }
  }

  async function handleProfileCoverSelected(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setIsUploadingCover(true);
    try {
      const imageUrl = await uploadImage(file, "covers");
      await updateProfileMedia({ coverImageUrl: imageUrl });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsUploadingCover(false);
      event.target.value = "";
    }
  }

  function goToPage(view) {
    if (view === "about") {
      setViewedProfile(null);
      setViewedProfilePosts([]);
      window.location.hash = "#about";
      return;
    }

    if (view === "profile") {
      window.location.hash = "#profile";
      return;
    }

    setViewedProfile(null);
    setViewedProfilePosts([]);
    window.location.hash = "#home";
  }

  function updateAboutMember(index, updates) {
    setAboutForm((current) => ({
      ...current,
      members: current.members.map((member, memberIndex) =>
        memberIndex === index ? { ...member, ...updates } : member
      )
    }));
  }

  async function handleAboutImageSelected(event, target, memberIndex = null) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setUploadingAboutKey(target);
    try {
      const imageUrl = await uploadImage(file, "about");
      if (target === "team") {
        setAboutForm((current) => ({ ...current, teamPhotoUrl: imageUrl }));
      } else if (memberIndex !== null) {
        updateAboutMember(memberIndex, { photoUrl: imageUrl });
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploadingAboutKey("");
      event.target.value = "";
    }
  }

  async function handleSaveAboutPage(event) {
    event.preventDefault();
    if (!currentUser || !isAdmin) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/about`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser.id,
          ...aboutForm
        })
      });
      await ensureOk(response, "Unable to save About Us page.");
      const payload = await response.json();
      setAboutPage(payload);
      setAboutForm(payload);
      setAuthMessage("About Us page updated.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSaveProfileDetails(event) {
    event.preventDefault();
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/${currentUser.id}/profile-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileDetailsForm)
      });
      await ensureOk(response, "Unable to update profile details.");
      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      setIsEditingProfileDetails(false);
      setAuthMessage("Profile details updated.");
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
      await ensureOk(response, "Login failed.");

      const payload = await response.json();
      setCurrentUser(payload.user);
      window.location.hash = "#home";
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
      const response = await fetch(`${API_BASE}/posts${editingPostId ? `/${editingPostId}` : ""}`, {
        method: editingPostId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingPostId ? { requesterId: currentUser.id } : { authorId: currentUser.id }),
          ...postForm
        })
      });
      await ensureOk(response, "Unable to publish the story.");
      const payload = await response.json();

      setAuthMessage(
        payload.status === "APPROVED"
          ? payload.moderationMessage || "Your story passed automatic moderation and is now live."
          : payload.moderationMessage || "Your story did not pass automatic moderation."
      );
      setPostForm(emptyPost);
      setEditingPostId(null);
      setIsComposerOpen(false);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleEditRejectedPost(post) {
    setPostForm({
      title: post.title || "",
      story: post.story || "",
      survivalLesson: post.survivalLesson || "",
      imageUrl: post.imageUrl || ""
    });
    setEditingPostId(post.id);
    setIsComposerOpen(true);
    setAuthMessage(`Editing "${post.title}". Update it and send it through moderation again.`);
    window.location.hash = "#home";
    window.setTimeout(() => {
      document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleCancelPostEdit() {
    setEditingPostId(null);
    setPostForm(emptyPost);
    setIsComposerOpen(false);
  }

  function handleSpeechInput(field) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice typing is not supported here. Try Chrome or another browser with speech recognition support.");
      return;
    }

    if (activeSpeechField === field && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setActiveSpeechField("");
      return;
    }

    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    speechRecognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    speechBaseValueRef.current = postForm[field] ? `${postForm[field].trim()} ` : "";

    recognition.onstart = () => {
      setError("");
      setActiveSpeechField(field);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      setPostForm((current) => ({
        ...current,
        [field]: transcript ? `${speechBaseValueRef.current}${transcript}`.trim() : current[field]
      }));
    };

    recognition.onerror = (event) => {
      setActiveSpeechField("");

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone or speech permission is blocked. Allow microphone access and try again.");
        return;
      }

      if (event.error === "audio-capture") {
        setError("No microphone was detected. Check your mic input and try again.");
        return;
      }

      if (event.error === "network") {
        setError("Your browser could not reach its speech service. Check internet access or try Chrome.");
        return;
      }

      if (event.error === "no-speech") {
        setError("No speech was detected. Speak a little closer to the mic and try again.");
        return;
      }

      setError("Voice typing is unavailable in this browser right now. Chrome usually works best for this feature.");
    };

    recognition.onend = () => {
      speechRecognitionRef.current = null;
      setActiveSpeechField("");
    };

    recognition.start();
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
      await ensureOk(response, "Unable to update the like.");
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
      await ensureOk(response, "Unable to add the comment.");
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      setOpenComments((current) => ({ ...current, [postId]: true }));
      setExpandedComments((current) => ({ ...current, [postId]: true }));
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDeletePost(postId, label = "delete this post") {
    if (!currentUser) {
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to ${label}?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: currentUser.id })
      });
      await ensureOk(response, "Unable to delete the post.");
      setAuthMessage(label === "cancel this pending post" ? "Pending post cancelled." : "Post deleted.");
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
      await ensureOk(response, "Unable to delete the comment.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function toggleComments(postId) {
    setOpenComments((current) => ({ ...current, [postId]: !current[postId] }));
  }

  function showAllComments(postId) {
    setOpenComments((current) => ({ ...current, [postId]: true }));
    setExpandedComments((current) => ({ ...current, [postId]: true }));
  }

  async function handleNarratePost(post) {
    if (activeNarrationPostId === post.id) {
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
        narrationAudioRef.current = null;
      }
      if (narrationAudioUrlRef.current) {
        URL.revokeObjectURL(narrationAudioUrlRef.current);
        narrationAudioUrlRef.current = "";
      }
      setActiveNarrationPostId(null);
      setLoadingNarrationPostId(null);
      return;
    }

    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current = null;
    }
    if (narrationAudioUrlRef.current) {
      URL.revokeObjectURL(narrationAudioUrlRef.current);
      narrationAudioUrlRef.current = "";
    }

    setError("");
    setLoadingNarrationPostId(post.id);

    try {
      const response = await fetch(`${API_BASE}/narration/posts/${post.id}`);
      await ensureOk(response, "Unable to generate AI narration right now.");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      narrationAudioRef.current = audio;
      narrationAudioUrlRef.current = audioUrl;
      setActiveNarrationPostId(post.id);
      setLoadingNarrationPostId(null);

      audio.onended = () => {
        setActiveNarrationPostId(null);
        narrationAudioRef.current = null;
        if (narrationAudioUrlRef.current) {
          URL.revokeObjectURL(narrationAudioUrlRef.current);
          narrationAudioUrlRef.current = "";
        }
      };

      audio.onerror = () => {
        setActiveNarrationPostId(null);
        setLoadingNarrationPostId(null);
        narrationAudioRef.current = null;
        if (narrationAudioUrlRef.current) {
          URL.revokeObjectURL(narrationAudioUrlRef.current);
          narrationAudioUrlRef.current = "";
        }
        setError("Unable to play AI narration right now.");
      };

      await audio.play();
    } catch (requestError) {
      setActiveNarrationPostId(null);
      setLoadingNarrationPostId(null);
      setError(requestError.message);
    }
  }

  function handleToggleSave(postId) {
    setSavedPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]
    );
  }

  async function handleShare(postId) {
    const shareUrl = `${window.location.origin}#post-${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setAuthMessage("Post link copied.");
    } catch {
      setAuthMessage(`Share this link: ${shareUrl}`);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setViewedProfile(null);
    setViewedProfilePosts([]);
    window.location.hash = "#home";
    setAuthMessage("");
    setError("");
  }

  function openMediaModal(type) {
    setMediaModal(type);
  }

  function closeMediaModal() {
    setMediaModal(null);
  }

  function openProfilePreview(userId) {
    const profile = users.find((user) => user.id === userId);
    if (profile) {
      setSelectedProfile(profile);
    }
  }

  function closeProfilePreview() {
    setSelectedProfile(null);
  }

  async function viewProfilePage(profile) {
    if (!profile) {
      return;
    }

    setSelectedProfile(null);

    if (currentUser && profile.id === currentUser.id) {
      setViewedProfile(null);
      setViewedProfilePosts([]);
      goToPage("profile");
      return;
    }

    setIsLoadingViewedProfile(true);
    try {
      const response = await fetch(`${API_BASE}/users/${profile.id}/posts`);
      await ensureOk(response, "Unable to load this profile right now.");
      const posts = await response.json();
      setViewedProfile(profile);
      setViewedProfilePosts(posts);
      goToPage("profile");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoadingViewedProfile(false);
    }
  }

  function openImagePreview(type, imageUrl, title, options = {}) {
    if (!imageUrl) {
      return;
    }
    setImagePreview({ type, imageUrl, title, ...options });
  }

  function closeImagePreview() {
    setImagePreview(null);
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function toggleSidebarSection(sectionKey) {
    setOpenSidebarSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey]
    }));
  }

  function toggleSidebar() {
    setIsSidebarOpen((current) => !current);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  function openUnityExperience() {
    if (currentUser) {
      const nextStreak = recordDoOrDieUsage(currentUser.id);
      setDoOrDieStreak(nextStreak);
    }
    window.location.href = UNITY_WEBGL_URL;
  }

  function readDoOrDieStreak(userId) {
    if (!userId) {
      return { count: 0, lastUsedAt: "" };
    }

    const saved = window.localStorage.getItem(DO_OR_DIE_STREAKS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    const storedRecord = parsed[userId] || { count: 0, lastUsedAt: "" };
    const normalizedRecord = normalizeDoOrDieStreak(storedRecord);

    if (
      normalizedRecord.count !== storedRecord.count ||
      normalizedRecord.lastUsedAt !== storedRecord.lastUsedAt
    ) {
      parsed[userId] = normalizedRecord;
      window.localStorage.setItem(DO_OR_DIE_STREAKS_KEY, JSON.stringify(parsed));
    }

    return normalizedRecord;
  }

  function recordDoOrDieUsage(userId) {
    const saved = window.localStorage.getItem(DO_OR_DIE_STREAKS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    const currentRecord = normalizeDoOrDieStreak(parsed[userId] || { count: 0, lastUsedAt: "" });
    const now = Date.now();
    const lastUsedTime = currentRecord.lastUsedAt ? Date.parse(currentRecord.lastUsedAt) : NaN;

    let nextCount = currentRecord.count || 0;
    if (!Number.isFinite(lastUsedTime)) {
      nextCount = 1;
    } else {
      const elapsed = now - lastUsedTime;
      if (elapsed >= WEEK_IN_MS * 2) {
        nextCount = 1;
      } else if (elapsed >= WEEK_IN_MS) {
        nextCount += 1;
      }
    }

    const nextRecord = {
      count: nextCount,
      lastUsedAt: new Date(now).toISOString()
    };

    parsed[userId] = nextRecord;
    window.localStorage.setItem(DO_OR_DIE_STREAKS_KEY, JSON.stringify(parsed));
    return nextRecord;
  }

  function normalizeDoOrDieStreak(streak) {
    if (!streak?.lastUsedAt) {
      return { count: 0, lastUsedAt: "" };
    }

    const lastUsedTime = Date.parse(streak.lastUsedAt);
    if (!Number.isFinite(lastUsedTime)) {
      return { count: 0, lastUsedAt: "" };
    }

    if (Date.now() - lastUsedTime >= WEEK_IN_MS * 2) {
      return { count: 0, lastUsedAt: "" };
    }

    return {
      count: streak.count || 0,
      lastUsedAt: streak.lastUsedAt
    };
  }

  function isDoOrDieStreakActive(streak) {
    if (!streak?.lastUsedAt) {
      return false;
    }

    const lastUsedTime = Date.parse(streak.lastUsedAt);
    if (!Number.isFinite(lastUsedTime)) {
      return false;
    }

    return Date.now() - lastUsedTime < WEEK_IN_MS;
  }

  const publishedPosts = myPosts.filter((post) => post.status === "APPROVED");
  const statusBoardPosts = myPosts.filter((post) => post.status !== "APPROVED" || post.moderationMessage);
  const isDoOrDieActive = isDoOrDieStreakActive(doOrDieStreak);
  const activeProfile = viewedProfile || currentUser || null;
  const isOwnProfile = currentUser ? !viewedProfile || viewedProfile.id === currentUser.id : false;
  const profilePosts = isOwnProfile ? myPosts : viewedProfilePosts.filter((post) => post.status === "APPROVED");
  const profilePageContent = activeProfile ? (
    <main className="profile-page">
      <section className="panel profile-page__hero">
        <button
          className="profile-page__cover"
          onClick={() =>
            openImagePreview("cover", activeProfile.coverImageUrl, `${activeProfile.displayName} cover`, {
              source: isOwnProfile ? "own-profile" : "public-profile"
            })
          }
          type="button"
          style={{
            backgroundImage: activeProfile.coverImageUrl
              ? `linear-gradient(rgba(7,7,10,0.18), rgba(7,7,10,0.5)), url(${activeProfile.coverImageUrl})`
              : undefined
          }}
        />
        <div className="profile-page__body">
          <button
            className="profile-page__avatar-button"
            onClick={() =>
              openImagePreview(
                "profile",
                activeProfile.profilePhotoUrl || "https://via.placeholder.com/320x320.png?text=SX",
                `${activeProfile.displayName} profile`,
                {
                  source: isOwnProfile ? "own-profile" : "public-profile"
                }
              )
            }
            type="button"
          >
            <img
              alt={activeProfile.displayName}
              className="profile-page__avatar"
              src={activeProfile.profilePhotoUrl || "https://via.placeholder.com/320x320.png?text=SX"}
            />
          </button>
          <div className="profile-page__identity">
            <div className="profile-page__identity-copy">
              <strong>{activeProfile.displayName}</strong>
              <span>@{activeProfile.username}</span>
              {activeProfile.email ? <small>{activeProfile.email}</small> : null}
            </div>
            {isOwnProfile ? (
              <button
                aria-label="Edit bio and focus"
                className="icon-button profile-page__edit-button"
                onClick={() => setIsEditingProfileDetails((current) => !current)}
                title="Edit bio and focus"
                type="button"
              >
                <EditIcon />
              </button>
            ) : (
              <button
                className="button button--secondary button--compact"
                onClick={() => goToPage("home")}
                type="button"
              >
                Back to Home
              </button>
            )}
          </div>
          {isOwnProfile && isEditingProfileDetails ? (
            <form className="profile-page__details-form" onSubmit={handleSaveProfileDetails}>
              <textarea
                className="input input--textarea"
                placeholder="Short bio"
                value={profileDetailsForm.bio}
                onChange={(event) =>
                  setProfileDetailsForm((current) => ({ ...current, bio: event.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Focus"
                value={profileDetailsForm.survivalFocus}
                onChange={(event) =>
                  setProfileDetailsForm((current) => ({
                    ...current,
                    survivalFocus: event.target.value
                  }))
                }
              />
              <div className="profile-page__details-actions">
                <button className="button button--secondary button--compact" type="submit">
                  Save
                </button>
                <button
                  className="button button--ghost button--compact"
                  onClick={() => {
                    setProfileDetailsForm({
                      bio: currentUser?.bio || "",
                      survivalFocus: currentUser?.survivalFocus || ""
                    });
                    setIsEditingProfileDetails(false);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-page__summary">
              <div className="profile-page__summary-row">
                <span>Short Bio</span>
                <p>{activeProfile.bio || "No bio added yet."}</p>
              </div>
              <div className="profile-page__summary-row">
                <span>Survival Focus</span>
                <p>{activeProfile.survivalFocus || "No focus added yet."}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel profile-page__posts">
        <div className="panel__header">
          <h2>{isOwnProfile ? "Your stories" : `${activeProfile.displayName}'s stories`}</h2>
          <p>
            {isOwnProfile
              ? "Everything you’ve posted in surviveX, including approved, pending, and rejected submissions."
              : "Approved stories this survivor has shared in surviveX."}
          </p>
        </div>
        <div className="profile-page__posts-grid">
          {isLoadingViewedProfile && !isOwnProfile ? <p className="muted">Loading profile stories...</p> : null}
          {!isLoadingViewedProfile && profilePosts.length === 0 ? (
            <p className="muted">{isOwnProfile ? "You have not posted any stories yet." : "No stories posted yet."}</p>
          ) : null}
          {profilePosts.map((post) => {
            const hasLiked = currentUser ? post.likedUserIds.includes(currentUser.id) : false;
            const isSaved = savedPostIds.includes(post.id);
            const isCommentsOpen = Boolean(openComments[post.id]);
            const isCommentsExpanded = Boolean(expandedComments[post.id]);
            const visibleComments =
              isCommentsExpanded || post.comments.length <= 2 ? post.comments : post.comments.slice(-2);
            const hiddenCommentsCount = Math.max(0, post.comments.length - visibleComments.length);

            return (
            <article
              key={post.id}
              className={`profile-story-card ${post.imageUrl ? "" : "profile-story-card--text-only"}`.trim()}
            >
              {post.imageUrl ? (
                <button
                  className="profile-story-card__image-button"
                  onClick={() => openImagePreview("post", post.imageUrl, post.title)}
                  type="button"
                >
                  <img alt={post.title} className="profile-story-card__image" src={post.imageUrl} />
                </button>
              ) : null}
              <div className="profile-story-card__copy">
                <div className="profile-story-card__header">
                  <div className="profile-story-card__meta">
                    <span className={`status-pill status-pill--${post.status.toLowerCase()}`}>{post.status}</span>
                    <small>{new Date(post.createdAt).toLocaleDateString()}</small>
                  </div>
                  <div className="profile-story-card__quick-actions">
                    <button
                      aria-label={
                        loadingNarrationPostId === post.id
                          ? "Loading narration"
                          : activeNarrationPostId === post.id
                            ? "Stop narration"
                            : "Listen to story"
                      }
                      className={`profile-story-card__icon-action ${
                        activeNarrationPostId === post.id ? "profile-story-card__icon-action--active" : ""
                      }`}
                      onClick={() => handleNarratePost(post)}
                      title={
                        loadingNarrationPostId === post.id
                          ? "Loading..."
                          : activeNarrationPostId === post.id
                            ? "Stop"
                            : "Listen"
                      }
                      type="button"
                    >
                      <span aria-hidden="true">
                        <MicIcon />
                      </span>
                    </button>
                    <button
                      aria-label="Share story"
                      className="profile-story-card__icon-action"
                      onClick={() => handleShare(post.id)}
                      title="Share"
                      type="button"
                    >
                      <span aria-hidden="true">
                        <ShareIcon />
                      </span>
                    </button>
                    <button
                      aria-label={isSaved ? "Unsave story" : "Save story"}
                      className={`profile-story-card__icon-action ${
                        isSaved ? "profile-story-card__icon-action--active" : ""
                      }`}
                      onClick={() => handleToggleSave(post.id)}
                      title={isSaved ? "Saved" : "Save"}
                      type="button"
                    >
                      <span aria-hidden="true">
                        <SaveIcon />
                      </span>
                    </button>
                  </div>
                </div>
                <h3>{post.title}</h3>
                <p>{post.story}</p>
                <div className="profile-story-card__lesson">
                  <span>Instinct that mattered</span>
                  <p>{post.survivalLesson}</p>
                </div>
                <div className="engagement">
                  <div className="engagement__buttons">
                    <button
                      className={`engagement-button ${hasLiked ? "engagement-button--active" : ""}`}
                      onClick={() => handleToggleLike(post.id)}
                      type="button"
                    >
                      <span className="engagement-button__icon" aria-hidden="true">
                        <ThumbIcon />
                      </span>
                      <span className="engagement-button__count">{post.likedUserIds.length}</span>
                    </button>
                    <button
                      className={`engagement-button ${isCommentsOpen ? "engagement-button--active" : ""}`}
                      onClick={() => toggleComments(post.id)}
                      type="button"
                    >
                      <span className="engagement-button__icon" aria-hidden="true">
                        <CommentIcon />
                      </span>
                      <span className="engagement-button__count">{post.comments.length}</span>
                    </button>
                  </div>
                  <span>{post.comments.length} comments</span>
                </div>
                {isCommentsOpen ? (
                  <>
                    <div className="comments">
                      {visibleComments.map((comment) => (
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
                    {hiddenCommentsCount > 0 ? (
                      <button
                        className="button button--ghost button--compact comments__load-more"
                        onClick={() => showAllComments(post.id)}
                        type="button"
                      >
                        Load more comments ({hiddenCommentsCount})
                      </button>
                    ) : null}

                    <form className="comment-form" onSubmit={(event) => handleAddComment(event, post.id)}>
                      <textarea
                        className="input input--textarea comment-form__box"
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
                  </>
                ) : null}
              </div>
            </article>
            );
          })}
        </div>
      </section>
    </main>
  ) : null;
  const introOverlay = showIntro ? (
    <div className="intro-splash" aria-hidden="true">
      <div className="intro-splash__glow" />
      <div className="intro-splash__brand">
        <span className="intro-splash__word">survive</span>
        <span className="intro-splash__x">X</span>
      </div>
    </div>
  ) : null;
  const aboutPageContent = (
    <main className="about-layout">
      <section ref={aboutPageRef} className="panel about-page">
        <div className="about-page__header reveal-on-scroll" data-reveal>
          <span className="eyebrow">Our Team</span>
          <h1>{aboutPage.title}</h1>
          <p>Meet the people behind surviveX.</p>
        </div>

        {currentUser && isAdmin ? (
          <form className="about-editor reveal-on-scroll" data-reveal onSubmit={handleSaveAboutPage}>
            <div className="panel__header">
              <h2>Admin Controls</h2>
              <p>Update team image, story, and member details here.</p>
            </div>
            <input
              className="input"
              placeholder="Page title"
              value={aboutForm.title}
              onChange={(event) => setAboutForm((current) => ({ ...current, title: event.target.value }))}
            />
            <textarea
              className="input input--textarea about-editor__story"
              placeholder="Team story"
              value={aboutForm.teamStory}
              onChange={(event) =>
                setAboutForm((current) => ({ ...current, teamStory: event.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Team photo URL"
              value={aboutForm.teamPhotoUrl || ""}
              onChange={(event) =>
                setAboutForm((current) => ({ ...current, teamPhotoUrl: event.target.value }))
              }
            />
            <label className="upload-field">
              <span>Upload team image</span>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(event) => handleAboutImageSelected(event, "team")}
              />
            </label>
            {uploadingAboutKey === "team" ? <p className="helper-text">Uploading team image...</p> : null}

            <div className="about-editor__members">
              {aboutForm.members.map((member, index) => (
                <section key={index} className="panel about-editor__member">
                  <input
                    className="input"
                    placeholder="Name"
                    value={member.name}
                    onChange={(event) => updateAboutMember(index, { name: event.target.value })}
                  />
                  <textarea
                    className="input input--textarea"
                    placeholder="Description"
                    value={member.description}
                    onChange={(event) => updateAboutMember(index, { description: event.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Photo URL"
                    value={member.photoUrl || ""}
                    onChange={(event) => updateAboutMember(index, { photoUrl: event.target.value })}
                  />
                  <label className="upload-field">
                    <span>Upload member image</span>
                    <input
                      className="input"
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleAboutImageSelected(event, `member-${index}`, index)}
                    />
                  </label>
                  {uploadingAboutKey === `member-${index}` ? (
                    <p className="helper-text">Uploading member image...</p>
                  ) : null}
                </section>
              ))}
            </div>

            <button className="button" type="submit">
              Save About Us
            </button>
          </form>
        ) : null}

        <section className="about-hero reveal-on-scroll" data-reveal>
          <div className="about-hero__image-wrap">
            <img
              alt={aboutPage.title}
              className="about-hero__image"
              src={aboutPage.teamPhotoUrl || "https://via.placeholder.com/1600x900.png?text=surviveX+Team"}
            />
            <div className="about-hero__story">
              <p>{aboutPage.teamStory}</p>
            </div>
          </div>
        </section>

        <section className="about-members">
          {aboutPage.members.map((member, index) => (
            <article
              key={`${member.name}-${index}`}
              className={`about-member reveal-on-scroll ${index % 2 === 1 ? "about-member--reverse" : ""}`}
              data-reveal
            >
              <div className="about-member__image-wrap">
                <img
                  alt={member.name}
                  className="about-member__image"
                  src={member.photoUrl || `https://via.placeholder.com/900x1000.png?text=${encodeURIComponent(member.name)}`}
                />
              </div>
              <div className="about-member__copy">
                <h3>{member.name}</h3>
                <p>{member.description}</p>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );

  if (!currentUser) {
    if (pageView === "about") {
      return (
        <div className="page-shell auth-page-shell">
          {introOverlay}
          <div className="app-frame">
            <nav className="top-nav top-nav--auth">
              <div className="top-nav__links">
                <button
                  className={`top-nav__link-button ${pageView === "about" ? "" : "top-nav__link-button--active"}`}
                  onClick={() => goToPage(pageView === "about" ? "home" : "about")}
                  type="button"
                >
                  {pageView === "about" ? "HOME" : "About Us"}
                </button>
              </div>
              <button className="top-nav__cta" onClick={openUnityExperience} type="button">
                DO or DIE
              </button>
              <div className="top-nav__right">
                <button
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  className={`theme-toggle ${theme === "light" ? "theme-toggle--light" : ""}`}
                  onClick={toggleTheme}
                  type="button"
                >
                  <span className="theme-toggle__track">
                    <span className="theme-toggle__thumb">
                      <span className="theme-toggle__icon">{theme === "dark" ? "🌙" : "☀"}</span>
                    </span>
                  </span>
                </button>
              </div>
            </nav>
            {aboutPageContent}
          </div>
        </div>
      );
    }

    return (
      <div className="page-shell auth-page-shell">
        {introOverlay}
        <div className="app-frame">
          <nav className="top-nav top-nav--auth">
            <div className="top-nav__links">
              <button
                className={`top-nav__link-button ${pageView === "about" ? "" : "top-nav__link-button--active"}`}
                onClick={() => goToPage(pageView === "about" ? "home" : "about")}
                type="button"
              >
                {pageView === "about" ? "HOME" : "About Us"}
              </button>
            </div>
            <button className="top-nav__cta" onClick={openUnityExperience} type="button">
              DO or DIE
            </button>
            <div className="top-nav__right">
              <button
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                className={`theme-toggle ${theme === "light" ? "theme-toggle--light" : ""}`}
                onClick={toggleTheme}
                type="button"
              >
                <span className="theme-toggle__track">
                  <span className="theme-toggle__thumb">
                    <span className="theme-toggle__icon">{theme === "dark" ? "🌙" : "☀"}</span>
                  </span>
                </span>
              </button>
            </div>
          </nav>

          <div className="auth-shell">
            <div className="auth-spotlight" />
            <section className="auth-panel auth-panel--brand">
              <span className="eyebrow">Global survival network</span>
              <h1 className="brand-mark">
                survive<span>X</span>
              </h1>
              <p className="typed-line">
                {typedText}
                <span className="typed-cursor">|</span>
              </p>
              <p className="auth-copy">
                Learn from real survival stories, sharpen your instincts, and understand the decisions
                that helped people stay alive when everything narrowed to one moment.
              </p>
              <div className="feature-list">
                <div className="feature-chip">AI moderation checks every story</div>
                <div className="feature-chip">Public approved feed</div>
                <div className="feature-chip">Profile identity and survival focus</div>
                <div className="feature-chip">Stay alert. Stay alive.</div>
              </div>
            </section>

            <section className="auth-panel auth-panel--form">
              <div className="auth-tabs">
                  <button
                    className={`auth-tab ${authMode === "login" ? "auth-tab--active" : ""}`}
                    onClick={() => {
                      setAuthMode("login");
                      setSignupStep(1);
                      setSignupMethod("standard");
                      setSignupFieldErrors({});
                      setError("");
                    }}
                    type="button"
                  >
                    Login
                  </button>
                  <button
                    className={`auth-tab ${authMode === "signup" ? "auth-tab--active" : ""}`}
                    onClick={() => {
                      setAuthMode("signup");
                      setSignupStep(1);
                      setSignupMethod("standard");
                      setSignupFieldErrors({});
                      setError("");
                    }}
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
                    <p>Login to enter the surviveX community, publish, review, and respond.</p>
                  </div>
                  <input
                    className="input"
                    placeholder="Username *"
                    value={loginForm.username}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, username: event.target.value }))
                    }
                  />
                  <input
                    className="input"
                    placeholder="Password *"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                  <button className="button" type="submit">
                    Enter surviveX
                  </button>
                  
                </form>
              ) : (
                <form className="form" onSubmit={handleSignup}>
                  <div className="panel__header">
                    <h2>{signupStep === 1 ? "Create your profile" : "Secure your account"}</h2>
                    <p>
                      {signupStep === 1
                        ? "Start with your email, name, and optional profile details."
                        : signupMethod === "google"
                          ? "Gmail filled in your name and email. Finish by choosing your username, password, and images."
                          : "Choose your username and password to finish creating the account."}
                    </p>
                  </div>
                  {signupStep === 1 ? (
                    <>
                      <input
                        className={`input ${signupFieldErrors.email ? "input--error" : ""}`}
                        placeholder="Email *"
                        type="email"
                        value={signupForm.email}
                        onChange={(event) => {
                          setSignupForm((current) => ({ ...current, email: event.target.value }));
                          setSignupFieldErrors((current) => {
                            const next = { ...current };
                            delete next.email;
                            return next;
                          });
                        }}
                      />
                      {signupFieldErrors.email ? <p className="helper-text helper-text--error">{signupFieldErrors.email}</p> : null}
                      <input
                        className={`input ${signupFieldErrors.fullName ? "input--error" : ""}`}
                        placeholder="Full name *"
                        value={signupForm.fullName}
                        onChange={(event) => {
                          setSignupForm((current) => ({ ...current, fullName: event.target.value }));
                          setSignupFieldErrors((current) => {
                            const next = { ...current };
                            delete next.fullName;
                            return next;
                          });
                        }}
                      />
                      {signupFieldErrors.fullName ? <p className="helper-text helper-text--error">{signupFieldErrors.fullName}</p> : null}
                      <textarea
                        className={`input input--textarea ${signupFieldErrors.bio ? "input--error" : ""}`}
                        placeholder="Short bio (example: I am a terrain expert)"
                        value={signupForm.bio}
                        onChange={(event) => {
                          setSignupForm((current) => ({ ...current, bio: event.target.value }));
                          setSignupFieldErrors((current) => {
                            const next = { ...current };
                            delete next.bio;
                            return next;
                          });
                        }}
                      />
                      {signupFieldErrors.bio ? <p className="helper-text helper-text--error">{signupFieldErrors.bio}</p> : null}
                      <input
                        className={`input ${signupFieldErrors.survivalFocus ? "input--error" : ""}`}
                        placeholder="Survival focus (example: I am a swimmer, I am in the army)"
                        value={signupForm.survivalFocus}
                        onChange={(event) => {
                          setSignupForm((current) => ({ ...current, survivalFocus: event.target.value }));
                          setSignupFieldErrors((current) => {
                            const next = { ...current };
                            delete next.survivalFocus;
                            return next;
                          });
                        }}
                      />
                      {signupFieldErrors.survivalFocus ? <p className="helper-text helper-text--error">{signupFieldErrors.survivalFocus}</p> : null}
                      <label className={`upload-field upload-field--action ${isUploadingProfile ? "upload-field--uploading" : ""}`}>
                        <span className="upload-field__label">
                          {isUploadingProfile ? (
                            <>
                              <span className="media-upload-spinner" aria-hidden="true" />
                              Uploading profile photo...
                            </>
                          ) : (
                            "Upload profile picture"
                          )}
                        </span>
                        <input
                          className="visually-hidden"
                          type="file"
                          accept="image/*"
                          disabled={isUploadingProfile}
                          onChange={handleProfileImageSelected}
                        />
                      </label>
                      {signupForm.profilePhotoUrl && !isUploadingProfile ? (
                        <p className="helper-text helper-text--success">Profile picture uploaded and ready.</p>
                      ) : null}
                      <label className={`upload-field upload-field--action ${isUploadingCover ? "upload-field--uploading" : ""}`}>
                        <span className="upload-field__label">
                          {isUploadingCover ? (
                            <>
                              <span className="media-upload-spinner" aria-hidden="true" />
                              Uploading cover image...
                            </>
                          ) : (
                            "Upload cover picture"
                          )}
                        </span>
                        <input
                          className="visually-hidden"
                          type="file"
                          accept="image/*"
                          disabled={isUploadingCover}
                          onChange={handleCoverImageSelected}
                        />
                      </label>
                      {signupForm.coverImageUrl && !isUploadingCover ? (
                        <p className="helper-text helper-text--success">Cover picture uploaded and ready.</p>
                      ) : null}
                      <p className="helper-text">Image uploads support files up to 10 MB.</p>
                      <div className="form-actions">
                        <button
                          className="button"
                          disabled={isUploadingProfile || isUploadingCover}
                          onClick={handleAdvanceSignupStep}
                          type="button"
                        >
                          Continue to account setup
                        </button>
                      </div>
                      <div className="signup-divider" aria-hidden="true">
                        <span>----- or -----</span>
                      </div>
                      <div className="signup-google">
                        {GOOGLE_CLIENT_ID ? (
                          <>
                            <div
                              className={`signup-google__button ${isGoogleSignupPending ? "signup-google__button--pending" : ""}`}
                              ref={googleSignupButtonRef}
                            />
                            {isGoogleSignupPending ? (
                              <p className="helper-text">Reading your Gmail profile...</p>
                            ) : null}
                          </>
                        ) : (
                          <p className="helper-text">Gmail signup is not configured yet.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        className={`input ${
                          signupFieldErrors.username
                            ? "input--error"
                            : signupUsernameStatus.state === "available"
                              ? "input--success"
                              : signupUsernameStatus.state === "unavailable" || signupUsernameStatus.state === "invalid"
                                ? "input--error"
                                : ""
                        }`}
                        placeholder="Username *"
                        value={signupForm.username}
                        onChange={(event) => {
                          setSignupForm((current) => ({ ...current, username: event.target.value }));
                          setSignupFieldErrors((current) => {
                            const next = { ...current };
                            delete next.username;
                            return next;
                          });
                        }}
                      />
                      <p
                        className={`helper-text ${
                          signupFieldErrors.username
                            ? "helper-text--error"
                            : signupUsernameStatus.state === "available"
                              ? "helper-text--success"
                              : signupUsernameStatus.state === "unavailable" || signupUsernameStatus.state === "invalid"
                                ? "helper-text--error"
                                : ""
                        }`}
                      >
                        {signupFieldErrors.username || signupUsernameStatus.message}
                      </p>
                      <input
                        className={`input ${signupFieldErrors.password ? "input--error" : ""}`}
                        placeholder="Create password *"
                        minLength="6"
                        type="password"
                        value={signupForm.password}
                        onChange={(event) => {
                          setSignupForm((current) => ({ ...current, password: event.target.value }));
                          setSignupFieldErrors((current) => {
                            const next = { ...current };
                            delete next.password;
                            return next;
                          });
                        }}
                      />
                      {signupFieldErrors.password ? (
                        <p className="helper-text helper-text--error">{signupFieldErrors.password}</p>
                      ) : null}
                      <input
                        className={`input ${signupFieldErrors.confirmPassword ? "input--error" : ""}`}
                        placeholder="Confirm password *"
                        minLength="6"
                        type="password"
                        value={signupForm.confirmPassword}
                        onChange={(event) => {
                          setSignupForm((current) => ({ ...current, confirmPassword: event.target.value }));
                          setSignupFieldErrors((current) => {
                            const next = { ...current };
                            delete next.confirmPassword;
                            return next;
                          });
                        }}
                      />
                      {signupFieldErrors.confirmPassword ? (
                        <p className="helper-text helper-text--error">{signupFieldErrors.confirmPassword}</p>
                      ) : null}
                      {signupMethod === "google" ? (
                        <>
                          <label className={`upload-field upload-field--action ${isUploadingProfile ? "upload-field--uploading" : ""}`}>
                            <span className="upload-field__label">
                              {isUploadingProfile ? (
                                <>
                                  <span className="media-upload-spinner" aria-hidden="true" />
                                  Uploading profile photo...
                                </>
                              ) : (
                                "Upload profile picture"
                              )}
                            </span>
                            <input
                              className="visually-hidden"
                              type="file"
                              accept="image/*"
                              disabled={isUploadingProfile}
                              onChange={handleProfileImageSelected}
                            />
                          </label>
                          {signupForm.profilePhotoUrl && !isUploadingProfile ? (
                            <p className="helper-text helper-text--success">Profile picture uploaded and ready.</p>
                          ) : null}
                          <label className={`upload-field upload-field--action ${isUploadingCover ? "upload-field--uploading" : ""}`}>
                            <span className="upload-field__label">
                              {isUploadingCover ? (
                                <>
                                  <span className="media-upload-spinner" aria-hidden="true" />
                                  Uploading cover image...
                                </>
                              ) : (
                                "Upload cover picture"
                              )}
                            </span>
                            <input
                              className="visually-hidden"
                              type="file"
                              accept="image/*"
                              disabled={isUploadingCover}
                              onChange={handleCoverImageSelected}
                            />
                          </label>
                          {signupForm.coverImageUrl && !isUploadingCover ? (
                            <p className="helper-text helper-text--success">Cover picture uploaded and ready.</p>
                          ) : null}
                          <p className="helper-text">Image uploads support files up to 10 MB.</p>
                        </>
                      ) : null}
                      <p className="helper-text">
                        Password must be at least 6 characters and include 1 uppercase letter, 1 lowercase
                        letter, 1 number, and 1 special character.
                      </p>
                      <div className="form-actions">
                        <button
                          className="button button--secondary"
                          onClick={() => {
                            setSignupStep(1);
                            setSignupMethod("standard");
                            setError("");
                          }}
                          type="button"
                        >
                          Back
                        </button>
                        <button className="button" type="submit">
                          Create account
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell" id="home">
      {introOverlay}
      <div className="app-frame">
        <nav className="top-nav">
          <div className="top-nav__links">
            <button
              aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              className={`icon-button nav-menu-button ${isSidebarOpen ? "nav-menu-button--active" : ""}`}
              onClick={toggleSidebar}
              type="button"
            >
              <MenuIcon />
            </button>
            <button
              className={`top-nav__link-button ${pageView === "home" ? "top-nav__link-button--active" : ""}`}
              onClick={() => goToPage("home")}
              type="button"
            >
              HOME
            </button>
            <button
              className={`top-nav__link-button ${pageView === "about" ? "top-nav__link-button--active" : ""}`}
              onClick={() => goToPage("about")}
              type="button"
            >
              About Us
            </button>
          </div>
          <button className="top-nav__cta" onClick={openUnityExperience} type="button">
            DO or DIE
          </button>
          <div className="top-nav__right">
            <div
              className={`streak-indicator ${isDoOrDieActive ? "streak-indicator--active" : ""}`}
              title={
                isDoOrDieActive
                  ? `Weekly DO or DIE streak active: ${doOrDieStreak.count}`
                  : "Use DO or DIE once this week to light your streak."
              }
            >
              <span className="streak-indicator__icon" aria-hidden="true">
                <FireIcon />
              </span>
              <span className="streak-indicator__count">{doOrDieStreak.count}</span>
            </div>
            <button
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className={`theme-toggle ${theme === "light" ? "theme-toggle--light" : ""}`}
              onClick={toggleTheme}
              type="button"
            >
              <span className="theme-toggle__track">
                <span className="theme-toggle__thumb">
                  <span className="theme-toggle__icon">{theme === "dark" ? "🌙" : "☀"}</span>
                </span>
              </span>
            </button>
            <button
              aria-label="Open my profile"
              className="top-nav__profile-button"
              onClick={() => viewProfilePage(currentUser)}
              title="My profile"
              type="button"
            >
              <img
                alt={currentUser.displayName}
                className="top-nav__profile-avatar"
                src={currentUser.profilePhotoUrl || "https://via.placeholder.com/160x160.png?text=SX"}
              />
            </button>
          </div>
        </nav>

        {pageView === "home" ? (
          <header className="hero">
            <div className="hero__copy">
              <span className="eyebrow">Approved public survival feed</span>
              <h1 className="brand-mark">
                survive<span>X</span>
              </h1>
              <p>
                A moderated social space where life-saving instincts, survival stories, and community
                responses are organized for real-world learning.
              </p>
            </div>
            <div className="hero__stats">
              <StatCard label="Members" value={overview.members} />
              <StatCard label="Approved Stories" value={overview.stories} />
              <StatCard label="Likes" value={overview.likes} />
              <StatCard label="Comments" value={overview.comments} />
            </div>
          </header>
        ) : null}

        {error ? <div className="banner banner--error">{error}</div> : null}
        {authMessage ? <div className="banner banner--success">{authMessage}</div> : null}

        <div
          className={`sidebar-backdrop ${isSidebarOpen ? "sidebar-backdrop--open" : ""}`}
          onClick={closeSidebar}
        />
        <aside className={`sidebar ${isSidebarOpen ? "sidebar--open" : ""}`}>
          <section className="panel profile-panel" id="profile">
            <div
              className={`profile-panel__cover ${isUploadingCover ? "profile-panel__cover--uploading" : ""}`}
              onClick={() => openMediaModal("cover")}
              role="button"
              tabIndex={0}
              style={{
                backgroundImage: currentUser.coverImageUrl
                  ? `linear-gradient(rgba(7,7,10,0.25), rgba(7,7,10,0.65)), url(${currentUser.coverImageUrl})`
                  : undefined
              }}
            >
              {isUploadingCover ? (
                <div className="media-upload-overlay">
                  <div className="media-upload-spinner" />
                  <span>Uploading cover...</span>
                </div>
              ) : null}
            </div>
            <input
              ref={coverInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              onChange={handleProfileCoverSelected}
            />
            <div className="profile-panel__body">
              <button
                className={`profile-panel__avatar-button ${isUploadingProfile ? "profile-panel__avatar-button--uploading" : ""}`}
                onClick={() => openMediaModal("profile")}
                type="button"
              >
                <img
                  alt={currentUser.displayName}
                  className="profile-panel__avatar"
                  src={currentUser.profilePhotoUrl || "https://via.placeholder.com/120x120.png?text=SX"}
                />
                {isUploadingProfile ? (
                  <span className="media-upload-overlay media-upload-overlay--avatar">
                    <span className="media-upload-spinner" />
                  </span>
                ) : null}
              </button>
              <input
                ref={profileInputRef}
                className="visually-hidden"
                type="file"
                accept="image/*"
                onChange={handleProfileAvatarSelected}
              />
              <div className="profile-panel__identity">
                <div className="profile-panel__identity-copy">
                  <strong>{currentUser.displayName}</strong>
                  <span>@{currentUser.username}</span>
                </div>
                <button
                  aria-label="Edit bio and focus"
                  className="icon-button profile-panel__edit-button"
                  onClick={() => setIsEditingProfileDetails((current) => !current)}
                  type="button"
                  title="Edit bio and focus"
                >
                  <EditIcon />
                </button>
              </div>
              {isEditingProfileDetails ? (
                <form className="profile-panel__details-form" onSubmit={handleSaveProfileDetails}>
                  <textarea
                    className="input input--textarea"
                    placeholder="Short bio"
                    value={profileDetailsForm.bio}
                    onChange={(event) =>
                      setProfileDetailsForm((current) => ({ ...current, bio: event.target.value }))
                    }
                  />
                  <input
                    className="input"
                    placeholder="Focus"
                    value={profileDetailsForm.survivalFocus}
                    onChange={(event) =>
                      setProfileDetailsForm((current) => ({
                        ...current,
                        survivalFocus: event.target.value
                      }))
                    }
                  />
                  <div className="profile-panel__details-actions">
                    <button className="button button--secondary button--compact" type="submit">
                      Save
                    </button>
                    <button
                      className="button button--ghost button--compact"
                      onClick={() => {
                        setProfileDetailsForm({
                          bio: currentUser.bio || "",
                          survivalFocus: currentUser.survivalFocus || ""
                        });
                        setIsEditingProfileDetails(false);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p>{currentUser.bio}</p>
                  <small>Focus: {currentUser.survivalFocus}</small>
                </>
              )}
              {isUploadingProfile || isUploadingCover ? (
                <p className="helper-text">Uploading profile image...</p>
              ) : (
                <p className="helper-text">Click cover or avatar to upload a new image.</p>
              )}
            </div>
            <button className="button button--ghost" onClick={handleLogout} type="button">
              Logout
            </button>
            <button
              className="button button--secondary"
              onClick={() => {
                goToPage("profile");
                closeSidebar();
              }}
              type="button"
            >
              View Profile Page
            </button>
          </section>

          <section className="panel accordion-panel">
            <button
              aria-expanded={openSidebarSections.published}
              className="accordion-panel__trigger"
              onClick={() => toggleSidebarSection("published")}
              type="button"
            >
              <div className="panel__header">
                <h2>Published stories</h2>
                <p>Stories that passed automatic moderation are already live in the public feed.</p>
              </div>
              <span className="accordion-panel__meta">
                <span className="accordion-panel__count">{publishedPosts.length}</span>
                <span
                  className={`accordion-panel__chevron ${
                    openSidebarSections.published ? "accordion-panel__chevron--open" : ""
                  }`}
                >
                  ▾
                </span>
              </span>
            </button>
            <div
              className={`accordion-panel__content ${
                openSidebarSections.published ? "accordion-panel__content--open" : ""
              }`}
            >
              <div className="submission-list">
              {publishedPosts.length === 0 ? <p className="muted">No published stories yet.</p> : null}
              {publishedPosts.map((post) => (
                <div key={post.id} className="submission-card">
                  <div className="submission-card__header">
                    <strong>{post.title}</strong>
                    <span className="status-pill status-pill--approved">APPROVED</span>
                  </div>
                  <p>{post.moderationMessage || "Published to the global feed."}</p>
                </div>
              ))}
              </div>
            </div>
          </section>

          <section className="panel accordion-panel">
            <button
              aria-expanded={openSidebarSections.status}
              className="accordion-panel__trigger"
              onClick={() => toggleSidebarSection("status")}
              type="button"
            >
              <div className="panel__header">
                <h2>Status board</h2>
                <p>Rejected stories stay here with the automatic moderation reason.</p>
              </div>
              <span className="accordion-panel__meta">
                <span className="accordion-panel__count">{statusBoardPosts.length}</span>
                <span
                  className={`accordion-panel__chevron ${
                    openSidebarSections.status ? "accordion-panel__chevron--open" : ""
                  }`}
                >
                  ▾
                </span>
              </span>
            </button>
            <div
              className={`accordion-panel__content ${
                openSidebarSections.status ? "accordion-panel__content--open" : ""
              }`}
            >
              <div className="submission-list">
              {statusBoardPosts.length === 0 ? <p className="muted">No reviewed posts yet.</p> : null}
              {statusBoardPosts.map((post) => (
                <div key={post.id} className="submission-card">
                  <div className="submission-card__header submission-card__header--stack">
                    <div>
                      <strong>{post.title}</strong>
                      <p className="helper-text">
                        {post.status === "APPROVED"
                          ? "Published to the feed."
                          : post.moderationMessage || "Rejected by automatic moderation."}
                      </p>
                    </div>
                    <div className="submission-card__actions">
                      <span className={`status-pill status-pill--${post.status.toLowerCase()}`}>
                        {post.status}
                      </span>
                      {post.moderationReasonCode ? (
                        <span className="status-pill">{post.moderationReasonCode.replaceAll("_", " ")}</span>
                      ) : null}
                      {post.status === "REJECTED" ? (
                        <button
                          className="button button--secondary button--compact"
                          onClick={() => handleEditRejectedPost(post)}
                          type="button"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </section>
        </aside>

        {pageView === "about" ? (
          aboutPageContent
        ) : pageView === "profile" ? (
          profilePageContent
        ) : (
        <main className="layout">
          <section className="content">
            <section className="panel panel--composer" id="composer">
              <div className="panel__header">
                <h2>Share a survival story</h2>
                <p>Tell the moment, what you noticed, and the instinct that changed the outcome.</p>
                <p>Tell your story. Own your glory.</p>
              </div>
              <div className="composer-toggle">
                <button
                  className="button"
                  onClick={() => {
                    if (isComposerOpen && editingPostId) {
                      handleCancelPostEdit();
                      return;
                    }
                    setIsComposerOpen((current) => !current);
                  }}
                  type="button"
                >
                  {isComposerOpen ? "Not in Mood to Post ?" : "Post Story"}
                </button>
              </div>
              {isComposerOpen ? (
                <form className="form" onSubmit={handleCreatePost}>
                  {editingPostId ? (
                    <p className="helper-text">You are editing a rejected story. Save it to send it through moderation again.</p>
                  ) : null}
                  <div className="voice-field">
                    <input
                      className="input"
                      placeholder="Post title"
                      value={postForm.title}
                      onChange={(event) =>
                        setPostForm((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                    <button
                      aria-label="Speak post title"
                      className={`icon-button voice-field__mic ${activeSpeechField === "title" ? "voice-field__mic--active" : ""}`}
                      onClick={() => handleSpeechInput("title")}
                      title="Voice type title"
                      type="button"
                    >
                      <MicIcon />
                    </button>
                  </div>
                  <div className="voice-field voice-field--textarea">
                    <textarea
                      className="input input--textarea input--story"
                      placeholder="Tell the full survival story"
                      value={postForm.story}
                      onChange={(event) =>
                        setPostForm((current) => ({ ...current, story: event.target.value }))
                      }
                    />
                    <button
                      aria-label="Speak survival story"
                      className={`icon-button voice-field__mic ${activeSpeechField === "story" ? "voice-field__mic--active" : ""}`}
                      onClick={() => handleSpeechInput("story")}
                      title="Voice type story"
                      type="button"
                    >
                      <MicIcon />
                    </button>
                  </div>
                  <div className="voice-field voice-field--textarea">
                    <textarea
                      className="input input--textarea"
                      placeholder="What instinct or lesson mattered most?"
                      value={postForm.survivalLesson}
                      onChange={(event) =>
                        setPostForm((current) => ({ ...current, survivalLesson: event.target.value }))
                      }
                    />
                    <button
                      aria-label="Speak survival lesson"
                      className={`icon-button voice-field__mic ${activeSpeechField === "survivalLesson" ? "voice-field__mic--active" : ""}`}
                      onClick={() => handleSpeechInput("survivalLesson")}
                      title="Voice type instinct"
                      type="button"
                    >
                      <MicIcon />
                    </button>
                  </div>
                  <input
                    className="input"
                    placeholder="Post image URL"
                    value={postForm.imageUrl}
                    onChange={(event) =>
                      setPostForm((current) => ({ ...current, imageUrl: event.target.value }))
                    }
                  />
                  <label className="upload-field">
                    <span>Upload post image</span>
                    <input className="input" type="file" accept="image/*" onChange={handlePostImageSelected} />
                  </label>
                  {isUploadingPostImage ? <p className="helper-text">Uploading post image...</p> : null}
                  <p className="helper-text">
                    Tap the mic to dictate in English into the title, story, or instinct fields.
                  </p>
                  <p className="helper-text">Post image uploads support files up to 10 MB.</p>
                  <div className="form-actions">
                    <button className="button" type="submit">
                      {editingPostId ? "Update Story" : "Submit for instant AI moderation"}
                    </button>
                    {editingPostId ? (
                      <button className="button button--ghost" onClick={handleCancelPostEdit} type="button">
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : null}
            </section>

            <section className="feed">
              <div className="feed__header">
                <h2>Community feed</h2>
                <p>Latest approved stories appear first. Every new story is checked automatically before it goes live.</p>
              </div>

              {isLoading ? <div className="panel">Loading surviveX...</div> : null}

              {feed.map((post) => {
                const hasLiked = currentUser ? post.likedUserIds.includes(currentUser.id) : false;
                const isSaved = savedPostIds.includes(post.id);
                const isCommentsOpen = Boolean(openComments[post.id]);
                const isCommentsExpanded = Boolean(expandedComments[post.id]);
                const visibleComments =
                  isCommentsExpanded || post.comments.length <= 2 ? post.comments : post.comments.slice(-2);
                const hiddenCommentsCount = Math.max(0, post.comments.length - visibleComments.length);

                return (
                  <article key={post.id} className="card" id={`post-${post.id}`}>
                    <div className="post-header">
                      <div className="post-author">
                        <button
                          className="post-author__avatar-button"
                          onClick={() => openProfilePreview(post.authorId)}
                          type="button"
                        >
                          <img
                            alt={post.authorName}
                            className="post-author__avatar"
                            src={post.authorProfilePhotoUrl || "https://via.placeholder.com/80x80.png?text=SX"}
                          />
                        </button>
                        <button
                          className="post-author__text post-author__text--button"
                          onClick={() => openProfilePreview(post.authorId)}
                          type="button"
                        >
                          <strong>{post.authorName}</strong>
                          <span>{post.authorHandle}</span>
                        </button>
                      </div>
                      <div className="post-tools">
                        <button
                          className="button button--secondary button--compact"
                          onClick={() => handleNarratePost(post)}
                          type="button"
                        >
                          {loadingNarrationPostId === post.id
                            ? "Loading..."
                            : activeNarrationPostId === post.id
                              ? "Stop"
                              : "Listen"}
                        </button>
                        <button
                          className="button button--secondary button--compact"
                          onClick={() => handleShare(post.id)}
                          type="button"
                        >
                          Share
                        </button>
                        <button
                          className="button button--secondary button--compact"
                          onClick={() => handleToggleSave(post.id)}
                          type="button"
                        >
                          {isSaved ? "Saved" : "Save"}
                        </button>
                        {currentUser.id === post.authorId || isAdmin ? (
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

                    <div className="post-topic">
                      <h3>{post.title}</h3>
                      <small>{new Date(post.createdAt).toLocaleString()}</small>
                    </div>

                    <p className="card__story">{post.story}</p>

                    {post.imageUrl ? (
                      <button
                        className="post-image-button"
                        onClick={() => openImagePreview("post", post.imageUrl, post.title)}
                        type="button"
                      >
                        <img alt={post.title} className="post-image" src={post.imageUrl} />
                      </button>
                    ) : null}

                    <div className="lesson">
                      <span>Instinct that mattered</span>
                      <p>{post.survivalLesson}</p>
                    </div>

                    <div className="engagement">
                      <div className="engagement__buttons">
                        <button
                          className={`engagement-button ${hasLiked ? "engagement-button--active" : ""}`}
                          onClick={() => handleToggleLike(post.id)}
                          type="button"
                        >
                          <span className="engagement-button__icon" aria-hidden="true">
                            <ThumbIcon />
                          </span>
                          <span className="engagement-button__count">{post.likedUserIds.length}</span>
                        </button>
                        <button
                          className={`engagement-button ${isCommentsOpen ? "engagement-button--active" : ""}`}
                          onClick={() => toggleComments(post.id)}
                          type="button"
                        >
                          <span className="engagement-button__icon" aria-hidden="true">
                            <CommentIcon />
                          </span>
                          <span className="engagement-button__count">{post.comments.length}</span>
                        </button>
                      </div>
                      <span>{post.comments.length} comments</span>
                    </div>

                    {isCommentsOpen ? (
                      <>
                        <div className="comments">
                          {visibleComments.map((comment) => (
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
                        {hiddenCommentsCount > 0 ? (
                          <button
                            className="button button--ghost button--compact comments__load-more"
                            onClick={() => showAllComments(post.id)}
                            type="button"
                          >
                            Load more comments ({hiddenCommentsCount})
                          </button>
                        ) : null}

                        <form className="comment-form" onSubmit={(event) => handleAddComment(event, post.id)}>
                          <textarea
                            className="input input--textarea comment-form__box"
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
                      </>
                    ) : null}
                  </article>
                );
              })}
            </section>
          </section>
        </main>
        )}
      </div>

      {mediaModal ? (
        <div className="media-modal-backdrop" onClick={closeMediaModal}>
          <div className="media-modal" onClick={(event) => event.stopPropagation()}>
            <div className="media-modal__header">
              <h2>{mediaModal === "profile" ? "Profile Picture" : "Cover Image"}</h2>
              <button className="icon-button" onClick={closeMediaModal} type="button">
                x
              </button>
            </div>
            {mediaModal === "profile" ? (
              <>
                <div className="media-modal__image-wrap">
                  <img
                    alt={currentUser.displayName}
                    className="media-modal__avatar"
                    src={currentUser.profilePhotoUrl || "https://via.placeholder.com/320x320.png?text=SX"}
                  />
                  {isUploadingProfile ? (
                    <div className="media-upload-overlay media-upload-overlay--modal">
                      <div className="media-upload-spinner" />
                      <span>Uploading profile...</span>
                    </div>
                  ) : null}
                </div>
                <button className="button" onClick={() => profileInputRef.current?.click()} type="button">
                  Change Profile
                </button>
              </>
            ) : (
              <>
                <div className="media-modal__image-wrap">
                  <div
                    className="media-modal__cover"
                    style={{
                      backgroundImage: currentUser.coverImageUrl
                        ? `linear-gradient(rgba(7,7,10,0.15), rgba(7,7,10,0.45)), url(${currentUser.coverImageUrl})`
                        : undefined
                    }}
                  />
                  {isUploadingCover ? (
                    <div className="media-upload-overlay media-upload-overlay--modal">
                      <div className="media-upload-spinner" />
                      <span>Uploading cover...</span>
                    </div>
                  ) : null}
                </div>
                <button className="button" onClick={() => coverInputRef.current?.click()} type="button">
                  Change Cover
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {selectedProfile ? (
        <div className="media-modal-backdrop" onClick={closeProfilePreview}>
          <div className="profile-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="media-modal__header">
              <h2>{selectedProfile.displayName}</h2>
              <button className="icon-button" onClick={closeProfilePreview} type="button">
                x
              </button>
            </div>
            <button
              className="profile-preview__cover"
              onClick={() =>
                openImagePreview("cover", selectedProfile.coverImageUrl, `${selectedProfile.displayName} cover`)
              }
              type="button"
              style={{
                backgroundImage: selectedProfile.coverImageUrl
                  ? `linear-gradient(rgba(7,7,10,0.2), rgba(7,7,10,0.45)), url(${selectedProfile.coverImageUrl})`
                  : undefined
              }}
            />
            <div className="profile-preview__body">
              <button
                className="profile-preview__avatar-button"
                onClick={() =>
                  openImagePreview(
                    "profile",
                    selectedProfile.profilePhotoUrl || "https://via.placeholder.com/320x320.png?text=SX",
                    `${selectedProfile.displayName} profile`
                  )
                }
                type="button"
              >
                <img
                  alt={selectedProfile.displayName}
                  className="profile-preview__avatar"
                  src={selectedProfile.profilePhotoUrl || "https://via.placeholder.com/320x320.png?text=SX"}
                />
              </button>
              <div className="profile-preview__info">
                <strong>{selectedProfile.displayName}</strong>
                <span>@{selectedProfile.username}</span>
                <p>{selectedProfile.bio}</p>
                <small>Focus: {selectedProfile.survivalFocus}</small>
              </div>
            </div>
            <div className="profile-preview__footer">
              <button className="button button--secondary" onClick={() => viewProfilePage(selectedProfile)} type="button">
                View Profile
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {imagePreview ? (
        <div className="media-modal-backdrop" onClick={closeImagePreview}>
          <div className="image-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="media-modal__header">
              <h2>{imagePreview.title}</h2>
              <button className="icon-button" onClick={closeImagePreview} type="button">
                x
              </button>
            </div>
            {imagePreview.type === "cover" ? (
              <img
                alt={imagePreview.title}
                className="image-preview-modal__cover-image"
                src={imagePreview.imageUrl}
              />
            ) : imagePreview.type === "post" ? (
              <img
                alt={imagePreview.title}
                className="image-preview-modal__post"
                src={imagePreview.imageUrl}
              />
            ) : (
              <img alt={imagePreview.title} className="image-preview-modal__avatar" src={imagePreview.imageUrl} />
            )}
            {imagePreview.source === "own-profile" && imagePreview.type === "profile" ? (
              <div className="image-preview-modal__actions">
                <button
                  className="button button--secondary button--compact"
                  disabled={isUploadingProfile}
                  onClick={() => profileInputRef.current?.click()}
                  type="button"
                >
                  {isUploadingProfile ? "Uploading..." : "Update Profile Photo"}
                </button>
              </div>
            ) : null}
            {imagePreview.source === "own-profile" && imagePreview.type === "cover" ? (
              <div className="image-preview-modal__actions">
                <button
                  className="button button--secondary button--compact"
                  disabled={isUploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  type="button"
                >
                  {isUploadingCover ? "Uploading..." : "Update Cover Photo"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FireIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" role="presentation">
      <path d="M13.6 2.3c.4 2.2-.3 4-2 5.8-1.1 1.2-1.7 2.2-1.7 3.7 0 1.4.8 2.6 2.2 3.1-.2-.8-.1-1.9.5-2.8.8-1.2 2.2-2.1 2.7-4.8 2.2 1.7 4.2 4.5 4.2 7.8 0 3.9-3 6.9-7.2 6.9S5 19 5 15.1c0-2.8 1.4-5 3.2-6.8 1.9-1.8 3.7-3.2 5.4-6Zm-1.7 17.9c1.8 0 3.1-1.2 3.1-3 0-1.2-.6-2.1-1.7-3-.2 1.2-.8 1.9-1.5 2.5-.7.7-1.3 1.4-1.3 2.5 0 .7.5 1 .7 1 .1 0 .2 0 .2-.1.1 0 .2.1.5.1Z" />
    </svg>
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

function EditIcon() {
  return (
    <svg aria-hidden="true" className="icon-button__icon" viewBox="0 0 24 24">
      <path
        d="M16.86 3.49a2.25 2.25 0 0 1 3.18 3.18l-9.9 9.9a2.5 2.5 0 0 1-1.06.62l-3.34.95a.75.75 0 0 1-.93-.93l.95-3.34a2.5 2.5 0 0 1 .62-1.06l9.9-9.9Zm-9.68 10.86-.43 1.52 1.52-.43 9.5-9.5-1.09-1.09-9.5 9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" className="icon-button__icon" viewBox="0 0 24 24">
      <path
        d="M12 14.5a3.25 3.25 0 0 0 3.25-3.25V6.75a3.25 3.25 0 1 0-6.5 0v4.5A3.25 3.25 0 0 0 12 14.5Zm-5-3.25a.75.75 0 0 1 1.5 0 3.5 3.5 0 1 0 7 0 .75.75 0 0 1 1.5 0 5 5 0 0 1-4.25 4.94V19h2.25a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5h2.25v-2.81A5 5 0 0 1 7 11.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ThumbIcon() {
  return (
    <svg aria-hidden="true" className="icon-button__icon" viewBox="0 0 24 24">
      <path
        d="M2 21h4V9H2v12Zm20-11.1c0-1.05-.82-1.9-1.84-1.9H14.3l.88-4.26.03-.32a1.4 1.4 0 0 0-.41-.99L14.05 2 9.46 6.72A2 2 0 0 0 9 8.09V19c0 1.1.86 2 1.92 2h6.51c.8 0 1.52-.49 1.82-1.23l2.19-5.4c.08-.2.12-.42.12-.64V9.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg aria-hidden="true" className="icon-button__icon" viewBox="0 0 24 24">
      <path
        d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2Zm2 5v2h12V9H6Zm0 4v2h8v-2H6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" className="icon-button__icon" viewBox="0 0 24 24">
      <path
        d="M18 3.5a3 3 0 0 0-2.82 4l-6.7 3.35a3 3 0 1 0 0 2.3l6.7 3.35A3 3 0 1 0 16.5 15a3 3 0 0 0-.12.82c0 .28.04.55.12.82l-6.7-3.35a3 3 0 0 0 0-2.58l6.7-3.35c-.08.27-.12.54-.12.82A3 3 0 1 0 18 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg aria-hidden="true" className="icon-button__icon" viewBox="0 0 24 24">
      <path
        d="M6 3.5h12A2.5 2.5 0 0 1 20.5 6v14.26a.75.75 0 0 1-1.16.63L12 16.2l-7.34 4.69a.75.75 0 0 1-1.16-.63V6A2.5 2.5 0 0 1 6 3.5Zm0 1.5A1 1 0 0 0 5 6v12.89l6.6-4.22a.75.75 0 0 1 .8 0L19 18.89V6a1 1 0 0 0-1-1H6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="icon-button__icon" viewBox="0 0 24 24">
      <path
        d="M4.5 7.25h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1 0-1.5Zm0 4h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1 0-1.5Zm0 4h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1 0-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

async function ensureOk(response, fallbackMessage) {
  if (!response.ok) {
    let message = fallbackMessage;

    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const payload = await response.json();
        message = payload.message || payload.error || fallbackMessage;
      } else {
        const text = await response.text();
        if (text.trim()) {
          message = text.trim();
        }
      }
    } catch (_error) {
      message = fallbackMessage;
    }

    throw new Error(message);
  }

  return response;
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/.test(password);
}

export default App;
