const BADGE_TIERS = [
  { min: 9.5, badge: "Dev Legend" },
  { min: 8, badge: "Elite Dev" },
  { min: 6, badge: "Pro Developer" },
  { min: 4, badge: "Rising Dev" },
  { min: 2, badge: "Profile Starter" },
];

export const getBadgeForScore = (score) => {
  const found = BADGE_TIERS.find((t) => score >= t.min);
  return found ? found.badge : null;
};

const clamp = (val, max) => Math.min(val, max);

const countNonEmpty = (arr) =>
  Array.isArray(arr) ? arr.filter((x) => x && String(x).trim() !== "").length : 0;

const strLen = (val) =>
  typeof val === "string" && val.trim() ? val.trim().length : 0;

export const calculateDevScore = (user = {}) => {
  const breakdown = [];
  const missingFields = [];

  const push = (category, points, max, detail, missing) => {
    breakdown.push({ category, points: Math.round(points * 10) / 10, max, detail });
    if (missing && missing.length) missingFields.push(...missing);
  };

  let basics = 0;
  const bioLen = strLen(user.bio);
  if (user.fullname && user.fullname.trim().length >= 2) basics += 0.5;
  else missingFields.push("fullname");
  if (bioLen >= 80) basics += 0.5;
  else if (bioLen >= 40) basics += 0.3;
  else missingFields.push("bio (at least 40 chars recommended)");
  if (user.profilePic) basics += 0.5;
  else missingFields.push("profilePic");
  if (user.location && user.location.trim()) basics += 0.3;
  else missingFields.push("location");
  if (user.role && user.role.trim()) basics += 0.2;
  else missingFields.push("role");
  basics = clamp(basics, 2.0);
  push("Profile Basics", basics, 2.0, "fullname, bio, photo, location, role", basics < 2.0 ? null : undefined);

  let tech = 0;
  const codingCount = countNonEmpty(user.codinglanguage);
  const techStackCount = countNonEmpty(user.techStack);
  const expVal = String(user.experience || "").trim();

  if (codingCount >= 3) tech += 1.0;
  else if (codingCount >= 1) tech += 0.5;
  else missingFields.push("codinglanguage (add at least 1)");

  if (techStackCount >= 4) tech += 1.0;
  else if (techStackCount >= 1) tech += 0.5;
  else missingFields.push("techStack (add at least 1)");

  if (user.githubUsername && user.githubUsername.trim()) tech += 0.5;
  else missingFields.push("githubUsername");

  if (user.portfolioUrl && user.portfolioUrl.trim()) tech += 0.5;
  else missingFields.push("portfolioUrl");

  if (expVal) tech += 0.5;
  else missingFields.push("experience");

  tech = clamp(tech, 3.5);
  push("Technical Depth", tech, 3.5, "languages, techStack, github, portfolio, experience", tech < 3.5 ? null : undefined);

  let prof = 0;
  if (user.linkedinUsername && user.linkedinUsername.trim()) prof += 0.5;
  else missingFields.push("linkedinUsername");
  if (user.timezone && user.timezone.trim()) prof += 0.3;
  else missingFields.push("timezone");
  if (user.availability && user.availability.trim() && user.availability !== "Occasional") prof += 0.4;
  else if (user.availability && user.availability.trim()) prof += 0.2;
  else missingFields.push("availability");
  if (user.lookingFor && user.lookingFor.trim()) prof += 0.3;
  else missingFields.push("lookingFor");
  prof = clamp(prof, 1.5);
  push("Professional Presence", prof, 1.5, "linkedin, timezone, availability, lookingFor", prof < 1.5 ? null : undefined);

  let growth = 0;
  const learningCount = countNonEmpty(user.learninglanguage);
  if (learningCount >= 2) growth += 0.5;
  else if (learningCount >= 1) growth += 0.3;
  else missingFields.push("learninglanguage");

  const interestsCount = countNonEmpty(user.interests);
  if (interestsCount >= 3) growth += 0.4;
  else if (interestsCount >= 1) growth += 0.2;
  else missingFields.push("interests");

  if (Number(user.completedProjects) >= 3) growth += 0.3;
  else if (Number(user.completedProjects) >= 1) growth += 0.15;

  if (Number(user.completedInterviews) >= 2) growth += 0.3;
  else if (Number(user.completedInterviews) >= 1) growth += 0.15;

  growth = clamp(growth, 1.5);
  push("Learning & Growth", growth, 1.5, "learning languages, interests, projects, interviews", growth < 1.5 ? null : undefined);

  let trust = 0;
  if (user.isVerified) trust += 1.0;
  else missingFields.push("Verify email (isVerified)");
  if (user.isOnBoarded) trust += 0.5;
  trust = clamp(trust, 1.5);
  push("Verification & Trust", trust, 1.5, "email verified, onboarding done", trust < 1.5 ? null : undefined);

  const rawScore = basics + tech + prof + growth + trust;
  const score = Math.min(10, Math.round(rawScore * 10) / 10);

  const badge = getBadgeForScore(score);
  const badges = badge ? [badge] : [];

  return {
    score,
    breakdown,
    missingFields: [...new Set(missingFields)],
    badges,
  };
};

