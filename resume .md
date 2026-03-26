# SocialHub Project Resume

## Project name
SocialHub - Unified Social Networking Platform.

## One-line project pitch
A full-stack social platform that combines media sharing, microblogging, professional networking, and real-time chat in one app.

## Problem statement
Users currently split their identity and activity across multiple apps (social posting, professional networking, and messaging). This project solves fragmentation by unifying those workflows into a single platform with safety controls and connection-based privacy.

## Target users
- General social users who want posting + messaging in one place.
- Creators who need media-first publishing.
- Professionals/recruiters who need profile + networking features.
- Communities that need moderation-aware social interaction.

## Your role (exact responsibilities)
Full-stack developer and system designer. Responsibilities included:
- Defining product scope and feature set.
- Building frontend UI with Next.js App Router components.
- Designing and implementing API route handlers.
- Modeling MongoDB schemas with Mongoose.
- Implementing JWT auth and role-aware access checks.
- Building real-time chat infrastructure with Socket.IO.
- Integrating moderation, streak, and violation-lock logic.
- Handling DX setup (Docker, seed/migration scripts, env configuration).

## Tech stack
- Next.js 14 (App Router)
- TypeScript
- MongoDB + Mongoose
- Socket.IO
- Redis (ioredis)
- Zustand
- Tailwind CSS
- Zod
- bcryptjs + jsonwebtoken
- Framer Motion

## Reason for choosing the tech stack
- Next.js App Router provides both UI and API handlers in one framework.
- TypeScript improves reliability across frontend, backend, and model contracts.
- MongoDB/Mongoose fits flexible social data (profiles, posts, comments, experiences).
- Socket.IO enables low-latency messaging, typing indicators, and read receipts.
- Redis supports fast presence/typing state with TTL semantics.
- Zustand keeps client state simple and lightweight without Redux overhead.
- Zod gives strict runtime validation for API payloads.

## High-level system architecture
- Frontend: Next.js app pages and reusable UI components.
- Backend API: Next.js route handlers under app/api for auth, posts, media, users, network, feed, moderation, chat, and streak.
- Realtime layer: standalone Socket.IO server for chat and presence.
- Persistence: MongoDB for core entities and relationships.
- Fast ephemeral state: Redis for online presence/typing.

## Data flow (client -> server -> database)
1. Client triggers action (for example create post, connect, send message).
2. Request reaches Next.js API route handler.
3. Auth check reads JWT from httpOnly cookie.
4. Input is validated using Zod schemas.
5. Business logic executes (moderation, visibility checks, streak updates).
6. MongoDB models are queried/updated via Mongoose.
7. JSON response returns standardized success/error payload.
8. For chat/presence, Socket.IO events are emitted and synced in real time.

## Core features (top 2-3 only)
1. Unified chronological feed:
Combines public + connection-scoped content from posts and media without algorithmic ranking.

2. Real-time messaging:
Conversation-based chat with typing indicators, read receipts, and online presence.

3. Safety + streak system:
Content moderation integrated with daily streak rewards, violation tracking, and progressive account locking.

## APIs used / created
### External APIs/services used
- OpenAI moderation integration (with local fallback patterns in moderation logic).

### Internal APIs created
- Auth:
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me
- Posts:
  - GET, POST /api/posts
  - GET, PATCH, DELETE /api/posts/[id]
  - POST /api/posts/[id]/like
  - POST /api/posts/[id]/comment
- Media:
  - GET, POST /api/media
  - PATCH, DELETE /api/media/[id]
  - POST /api/media/[id]/like
  - POST /api/media/[id]/comment
  - GET /api/media/user/[username]
- Users:
  - GET /api/users
  - GET, PATCH /api/users/[username]
  - POST /api/users/[username]/experience
  - POST /api/users/[username]/education
- Network:
  - POST /api/network/connect
  - POST /api/network/accept
  - GET /api/network/connections
  - DELETE /api/network/[connectionId]
- Feed:
  - GET /api/feed
- Chat:
  - GET, POST /api/chat/conversation
  - POST /api/chat/group
  - GET, POST /api/chat/messages/[conversationId]
  - PUT /api/chat/messages/[conversationId]/seen
- Safety:
  - POST /api/moderation
  - GET /api/streak

## Database schema / models
- User:
  - identity fields, role, profile metadata, skills, experience, education
  - streak, violations, and accountLock nested objects
- Post:
  - author, type, content, media, visibility, likes, comments, repost metadata
- Media:
  - owner, URL/type/caption, likes/comments
- Connection:
  - requester, recipient, status (pending/accepted/rejected)
- Conversation:
  - participants, group metadata, lastMessage
- Message:
  - conversation, sender, content/type, seenBy, deletedFor

## Authentication & authorization (if any)
- Authentication:
  - Email/password login with bcrypt hash verification.
  - JWT issued after login and stored in httpOnly cookie.
  - Protected APIs use requireAuth-style middleware.
- Authorization:
  - Owner checks on mutable resources (posts/profile edits).
  - Role-aware behavior via user role field (user/creator/recruiter/admin).
  - Visibility checks enforce public/connections/private access.

## State management approach
- Zustand stores for auth and chat session state.
- Local component state for page-level UI interactions.
- Optimistic UI updates for likes/comments/connections to improve responsiveness.
- Custom hooks (API/network/socket) for reusable side-effect logic.

## Hardest technical challenge
Designing a safe moderation pipeline that enforces behavior rules (violation counts and progressive locking) without breaking UX or blocking core posting workflows.

## How you solved it
- Added structured user safety fields (streak, violations, accountLock).
- Introduced moderation checks before writes in posting/comment flows.
- Implemented daily violation counting and automatic progressive lock durations.
- Added user-facing error payloads with actionable lock/violation context.
- Added migration script to backfill streak/safety fields for existing users.

## Problems faced and how did i resolve it
1. Comment/like flows had inconsistent UX and API coupling.
Resolution: Built dedicated handlers with optimistic updates and rollback-on-error behavior.

2. Media upload UX was weak and prompt-based.
Resolution: Replaced with file input workflow, previews, and remove-before-submit controls.

3. Connection management logic caused state duplication issues.
Resolution: Centralized actions in a network hook and normalized tab filtering for connections/pending/suggestions.

4. Safety enforcement risked being either too weak or too disruptive.
Resolution: Implemented progressive lock durations and transparent error messaging, not instant permanent bans.

5. Presence/realtime reliability depended on Redis availability.
Resolution: Added fallback behavior for in-memory presence so chat remains usable during Redis issues.

## Trade-offs made
- Chose chronological feed simplicity over algorithmic relevance/ranking.
- Used a separate Socket.IO server for realtime clarity, adding deployment complexity.
- Prioritized rapid feature delivery and manual verification over broad automated test coverage.
- Kept moderation strictness practical to avoid high false-positive user frustration.

## Limitations of the project
- No comprehensive automated unit/integration test suite yet.
- Horizontal scaling strategy for Socket.IO is not fully production-hardened.
- Feed/search discovery features are still basic (no advanced ranking/search engine).
- Notifications and analytics depth are limited in current version.

## Performance considerations
- Pagination across APIs to avoid large payloads.
- Indexed fields on core models for common access patterns.
- Redis TTL usage for ephemeral state (presence/typing) to reduce DB pressure.
- Lean data access and selective population in feed/conversation queries.

## Security considerations
- Passwords hashed with bcrypt.
- JWT stored in httpOnly cookies with secure/sameSite settings.
- Input validation via Zod on API boundaries.
- Visibility- and ownership-based authorization checks.
- Content moderation + progressive lock system to reduce abuse.

## Error handling strategy
- Standardized API response envelope for success/error.
- Explicit HTTP status mapping for validation/auth/not-found/server errors.
- Try/catch around route handlers with centralized error response patterns.
- Client surfaces actionable messages, especially for moderation/lock errors.

## Testing done (unit / integration / manual)
- Manual testing completed for core social flows (create post, like, comment, share, connect, chat).
- Scenario-based testing documented for streak/violation/lock behavior.
- Seed and migration scripts used to validate data and edge transitions.
- Current gap: limited automated unit/integration test coverage.

## Deployment method
- Local/dev:
  - Next.js app server on port 3000.
  - Socket.IO server on port 3001.
- Services:
  - MongoDB + Redis via Docker Compose for local infrastructure.
- Build flow:
  - Next.js build/start scripts plus standalone socket process.

## Tools & services used
- VS Code
- Docker + Docker Compose
- Node.js/npm ecosystem
- MongoDB
- Redis
- Next.js runtime
- Socket.IO server/client
- OpenAI moderation integration

## Results / impact
- Delivered an MVP-level unified social platform with production-style architecture.
- Core social interactions are functional end-to-end (content, networking, chat).
- Safety and moderation features go beyond basic CRUD and introduce behavior governance.
- Documentation and setup flow make onboarding straightforward for contributors.

## What you’d improve next
1. Add automated tests (unit, integration, e2e) and CI checks.
2. Introduce scalable realtime architecture (Redis adapter + horizontal socket scaling).
3. Add richer discovery/search and notification systems.
4. Improve media pipeline (direct uploads/CDN optimization).
5. Add observability (structured metrics, tracing, alerting).

## Key learnings
- Combining multiple social paradigms in one platform requires strict domain boundaries.
- Early schema design for safety/governance features avoids painful late rewrites.
- Optimistic UI significantly improves perceived speed but needs careful rollback paths.
- Realtime systems need graceful degradation paths (like Redis fallback) from day one.
- Clear API contracts and validation are essential when features scale quickly.

---

## AI role addendum

## Project name (AI)
SentinelAI moderation module integrated into SocialHub.

## One-line project pitch (AI)
Built text and image toxicity classifiers for real-time safety enforcement using lightweight deployable ONNX inference.

## Problem statement (AI)
User-generated content can include harassment and unsafe media, so the platform needed low-latency moderation to block harmful content before publish and support progressive enforcement.

## Target users (AI)
- Platform moderation and trust-and-safety workflows.
- End users who need safer timelines and comment sections.
- Product owners who need explainable moderation outcomes for lock/warning flows.

## Your role (AI exact responsibilities)
- Designed and implemented text harassment detection pipeline.
- Implemented image NSFW detection pipeline.
- Built training scripts, evaluation loops, and model export workflow.
- Implemented ONNX runtime inference for fast CPU-friendly deployment.
- Integrated model outputs into moderation decision flow and violation tracking.

## Tech stack (AI)
- Python
- PyTorch
- Hugging Face Transformers + Datasets
- torchvision (MobileNetV2)
- ONNX + onnxruntime
- scikit-learn metrics (accuracy, F1)

## Reason for choosing the AI stack
- Transformers provide strong baseline NLP classification performance.
- MobileNetV2 offers compact vision inference suitable for production constraints.
- ONNX Runtime enables fast portable CPU inference.
- Hugging Face dataset tooling accelerates preprocessing and experimentation.

## High-level system architecture (AI)
1. Training layer:
  - text_toxicity/train.py fine-tunes transformer binary classifier.
  - image_toxicity/train.py fine-tunes MobileNetV2 binary classifier.
2. Export layer:
  - export scripts convert trained models for ONNX deployment.
3. Inference layer:
  - text_toxicity/inference.py predicts HARASSMENT vs SAFE.
  - image_toxicity/inference.py predicts NSFW vs SAFE.
4. Integration layer:
  - moderation service consumes classifier outputs and enforces post/comment rejection plus violation increments.

## Data flow (AI client -> server -> model)
1. Client submits post/comment/media.
2. Server moderation entrypoint invokes inference.
3. Model returns class probabilities and confidence.
4. Server maps prediction to policy decision (allow/reject/warn).
5. Violation-tracker updates daily count/streak/lock state.

## Core features (AI top 2-3)
1. Text harassment detection with binary classification and confidence scores.
2. Image NSFW detection optimized for lightweight inference.
3. Safety policy integration with progressive account locking.

## APIs used / created (AI)
- Internal moderation pathway used by post/comment write APIs.
- Inference modules expose callable prediction interface returning label + confidence + class probabilities.

## Database schema / models impacted by AI
- User.violations
- User.accountLock
- User.streak
AI decisions directly drive updates to these fields through moderation and violation tracking.

## Authentication & authorization (AI context)
Moderation decisions run only in authenticated content-creation paths, so inference is protected behind existing API auth boundaries.

## State management approach (AI context)
Server-side deterministic moderation decisions; client receives structured error payloads for lock and violation states.

## Hardest technical challenge (AI)
Balancing moderation strictness, model latency, and deployment practicality across both text and image inputs.

## How you solved it (AI)
- Used smaller backbone models for speed.
- Added ONNX inference path for CPU efficiency.
- Returned confidence and probability outputs for transparent policy mapping.
- Kept fallback-compatible flow so moderation could remain operational even during model/dependency issues.

## Problems faced and how did i resolve it (AI)
1. Inference latency risk on commodity CPUs.
Resolution: Exported and served ONNX models with onnxruntime.

2. Dataset realism mismatch for early image experiments.
Resolution: Used proxy dataset for pipeline validation and documented replacement strategy for production NSFW datasets.

3. Decision ambiguity around borderline predictions.
Resolution: Exposed confidence and class probabilities for policy-threshold tuning.

4. Integration complexity with platform safety logic.
Resolution: Coupled classifier output to violation tracker and progressive lock mechanism with consistent error payloads.

## Trade-offs made (AI)
- Prioritized speed and deployability over very large models.
- Used binary classes first for policy simplicity before fine-grained taxonomy.
- Accepted proxy-data experimentation in image pipeline to validate end-to-end system quickly.

## Limitations of the AI module
- Image training currently uses a proxy dataset for demo workflow.
- Limited threshold calibration/benchmark reporting in current docs.
- No full MLOps pipeline (model registry, drift monitoring, automated retraining).

## Performance considerations (AI)
- MAX_LEN token cap for text inference.
- MobileNetV2 chosen for compact image inference.
- ONNX runtime CPU provider for practical deployment.

## Security considerations (AI)
- Moderation blocks harmful content before persistence.
- Confidence-driven decisions reduce silent false positives by enabling explicit policy handling.
- AI decisions are not exposed as client-controlled flags; enforcement remains server-side.

## Error handling strategy (AI)
- If model artifacts are missing, scripts fail with explicit operational messages.
- In platform flow, moderation failures return structured API errors with lock/violation context.

## Testing done (AI)
- Training-time validation with accuracy and F1 tracking.
- CLI/manual inference checks for text and image paths.
- End-to-end manual moderation verification through post/comment flows.

## Deployment method (AI)
- Train/fine-tune in Python environment.
- Export to ONNX artifacts.
- Load ONNX models in inference runtime and invoke through backend moderation pipeline.

## Tools & services used (AI)
- PyTorch, Transformers, torchvision, onnxruntime
- Hugging Face datasets/model hub
- scikit-learn metrics and tqdm progress tracking

## Results / impact (AI)
- Delivered practical automated moderation signals for text and image content.
- Enabled platform-level enforcement with streak reset and progressive lock outcomes.
- Improved moderation consistency versus purely manual filtering.

## What you’d improve next (AI)
1. Replace proxy image data with production-grade NSFW datasets and stronger evaluation benchmarks.
2. Add threshold tuning per category and false-positive analysis.
3. Add monitoring for drift, confidence distributions, and moderation outcomes.
4. Introduce retraining/versioned rollout pipeline.

## Key learnings (AI)
- Deployable ML systems require equal focus on inference speed and policy integration.
- Binary classifiers are a good first operational step, then expand taxonomy.
- Confidence-aware moderation is easier to operationalize than raw labels alone.
