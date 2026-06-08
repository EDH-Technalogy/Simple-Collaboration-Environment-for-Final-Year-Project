const STORAGE_KEY = "admin.blogs.collection";

export const initialBlogs = [
  {
    id: 1,
    title: "What is Infrastructure as a Service?",
    excerpt:
      "Infrastructure as a Service gives teams on-demand compute, storage, and networking so deployments can scale without owning physical hardware.",
    author: "Amina Rahimi",
    authorRole: "Cloud Platform Writer",
    category: "Cloud Computing",
    date: "2026-04-18",
    readTime: "6 min read",
    status: "published",
    featured: true,
    comments: 18,
    claps: 164,
    coverImage:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    tags: ["cloud", "iaas", "infrastructure"],
    content: `
      <p>Infrastructure as a Service, or IaaS, is one of the clearest ways to explain cloud computing because it replaces the most expensive part of running software: owning and operating machines yourself.</p>
      <p>Instead of buying servers, networking equipment, and backup systems up front, a team rents those capabilities from a cloud provider and scales them when needed. That matters for universities, startups, and product teams because demand is rarely constant.</p>
      <h2>What changes when infrastructure becomes a service</h2>
      <p>The shift is not only financial. It changes delivery speed. A small team can provision environments in minutes, experiment without long procurement cycles, and shut resources down when a project ends.</p>
      <blockquote>In practice, IaaS turns infrastructure from a fixed asset into an operational tool.</blockquote>
      <p>That flexibility is why IaaS is common for application hosting, research environments, data pipelines, staging systems, and internal tools. When teams need more storage or more compute, they expand without redesigning the whole system.</p>
      <h2>Core building blocks</h2>
      <p>Most IaaS platforms expose three fundamentals: compute, storage, and networking. Compute gives you virtual machines or instances. Storage handles files, databases, and backups. Networking connects workloads securely and controls access between them.</p>
      <p>On top of those basics, teams usually add monitoring, identity controls, logging, and automation. That is where cloud maturity starts to matter, because unmanaged flexibility can quickly become operational sprawl.</p>
      <h2>Why admins and reviewers should care</h2>
      <p>When a writer explains IaaS well, the article helps non-technical stakeholders understand why infrastructure decisions affect cost, resilience, and delivery speed. For an admin review flow, that means checking not only grammar but also whether the explanation is accurate, balanced, and useful to readers.</p>
      <p>A strong IaaS article should make it obvious when cloud services are a fit, when they are overkill, and what tradeoffs come with outsourcing infrastructure ownership.</p>
    `,
  },
  {
    id: 2,
    title: "MLOps Pipelines for University Research Teams",
    excerpt:
      "A practical guide for versioning datasets, automating training, and keeping model experiments reproducible across academic teams.",
    author: "Bilal Sadiqi",
    authorRole: "Machine Learning Engineer",
    category: "AI & Data",
    date: "2026-04-20",
    readTime: "8 min read",
    status: "pending",
    featured: false,
    comments: 9,
    claps: 57,
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    tags: ["mlops", "ai", "research"],
    content: `
      <p>Many research teams build models successfully once and then struggle to repeat the result six weeks later. The issue is rarely model quality alone. It is usually process quality.</p>
      <p>MLOps introduces structure around data versioning, experiment tracking, evaluation, and deployment. In academic environments, that structure is especially useful because contributors rotate often and project ownership changes between semesters.</p>
      <h2>Reproducibility is the first milestone</h2>
      <p>If a team cannot recreate the same training run with the same data and code, every future improvement becomes harder to trust. A pipeline should capture dataset versions, feature definitions, hyperparameters, and model outputs from the start.</p>
      <p>That does not require enterprise-scale tooling on day one. It requires discipline, naming conventions, and a workflow that makes the correct path easier than the messy one.</p>
      <h2>Build the pipeline around handoffs</h2>
      <p>University teams often move between students, supervisors, and lab assistants. Pipelines should therefore optimize for handoff clarity: where the data comes from, how models are trained, who approves evaluation, and what qualifies a model for publication or release.</p>
      <h2>What an admin should review before publishing</h2>
      <p>For a public-facing article, the most important moderation question is whether the author explains operational reality rather than only ideal architecture. Readers should leave understanding both the value of automation and the cost of maintaining it.</p>
    `,
  },
  {
    id: 3,
    title: "Zero Trust Access for Campus Platforms",
    excerpt:
      "This article explains how role-aware access control protects faculty and student services without adding unnecessary friction.",
    author: "Farzana Noori",
    authorRole: "Security Analyst",
    category: "Cybersecurity",
    date: "2026-04-14",
    readTime: "5 min read",
    status: "accepted",
    featured: false,
    comments: 7,
    claps: 83,
    coverImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    tags: ["security", "zero-trust", "access"],
    content: `
      <p>Zero trust is often reduced to a slogan, but its operational meaning is simple: no request is trusted automatically just because it comes from inside the network.</p>
      <p>For campus systems, that matters because the same platform may serve administrators, faculty, students, and external collaborators. Each role should see only what its work requires.</p>
      <h2>Identity beats location</h2>
      <p>Traditional campus systems often assume that traffic from a known network is safer. Zero trust replaces that assumption with explicit verification, device checks, and policy-driven authorization.</p>
      <p>That model is stronger because modern access patterns are distributed. Work happens from homes, labs, classrooms, and personal devices.</p>
      <h2>Good security should feel boring</h2>
      <p>The best access-control systems are not dramatic. They quietly restrict sensitive actions, preserve auditability, and keep legitimate users moving with minimal interruption.</p>
    `,
  },
  {
    id: 4,
    title: "Designing Better Dashboards for Admin Workflows",
    excerpt:
      "Good dashboard design reduces review time, highlights blocked work clearly, and helps admins decide faster with less noise.",
    author: "Hamid Popal",
    authorRole: "Product Designer",
    category: "Product Design",
    date: "2026-04-12",
    readTime: "7 min read",
    status: "rejected",
    featured: false,
    comments: 5,
    claps: 31,
    coverImage:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1600&q=80",
    tags: ["dashboard", "ux", "admin"],
    content: `
      <p>Administrative interfaces usually fail for one reason: they prioritize density over decision-making. More numbers do not automatically mean more clarity.</p>
      <p>A dashboard should reveal what needs attention now, what is waiting, and what action is safe to take next. If the interface hides those answers, the design is decorative rather than useful.</p>
      <h2>Review flows need obvious states</h2>
      <p>Approval systems are strongest when pending, accepted, rejected, and published items look different at a glance. The state of an item should never require opening a menu to understand.</p>
      <p>Design should accelerate operational judgment, not force the user to reconstruct it.</p>
    `,
  },
  {
    id: 5,
    title: "How Faculty Teams Can Use Git Without Friction",
    excerpt:
      "A lightweight workflow for branching, peer review, and release discipline that works well for mixed technical experience levels.",
    author: "Sahar Wafayi",
    authorRole: "Engineering Program Lead",
    category: "Engineering",
    date: "2026-04-09",
    readTime: "4 min read",
    status: "draft",
    featured: false,
    comments: 3,
    claps: 22,
    coverImage:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80",
    tags: ["git", "workflow", "teams"],
    content: `
      <p>Git becomes intimidating when teams learn commands before they understand the workflow those commands are meant to support.</p>
      <p>For mixed-experience faculty teams, the most useful starting point is a small agreement: one branch for stable work, short-lived feature branches, and lightweight reviews before merging.</p>
      <h2>Minimize vocabulary before maximizing process</h2>
      <p>Most teams do not need a complex branching strategy at the start. They need predictable naming, clear ownership, and a shared expectation for when work is ready for review.</p>
      <p>That discipline makes Git feel collaborative rather than punitive.</p>
    `,
  },
];

export function loadAdminBlogs() {
  if (typeof window === "undefined") return initialBlogs;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialBlogs;

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : initialBlogs;
  } catch {
    return initialBlogs;
  }
}

export function saveAdminBlogs(blogs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
}

export function getAdminBlogById(id) {
  return loadAdminBlogs().find((blog) => String(blog.id) === String(id));
}
