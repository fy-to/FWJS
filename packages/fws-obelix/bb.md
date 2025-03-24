# Obelix Forum System Documentation

## Overview

The Obelix Forum System (ObelixBB) is a complete forum/bulletin board implementation that provides functionality for creating boards, posts, replies, and voting. It has been enhanced with modern features like rich formatting, tags, reactions, notifications, subscriptions, and drafts.

## Database Schema

### Original Tables

#### ObelixBB (Boards)

```
- uuid: UUID (primary key)
- realm_uuid: UUID (foreign key to realm)
- name: String (255 chars)
- url: String (255 chars, optional)
- description: Text (optional)
- cover_uuid: UUID (foreign key to blob, optional)
- created_at: DateTime
- updated_at: DateTime
- post_count: Integer (default 0)
- reply_count: Integer (default 0)
- order_index: Integer (default 0)
- group_index: Integer (default 0)
- last_post_id: Integer (optional)

# New fields
- icon: String (50 chars, optional) - Material icon or emoji
- theme_color: String (20 chars, optional) - Board theme color
- meta_tags: JSON (optional) - SEO and metadata
- rules: Text (optional) - Board rules
- is_private: Boolean (default false) - Whether board is private
- requires_subscription: Boolean (default false) - Whether board requires subscription
- moderator_uuids: JSON (optional) - List of user UUIDs who can moderate
```

#### ObelixBBPost (Posts)

```
- id: Integer (primary key, auto-increment)
- user_uuid: UUID (foreign key to user)
- board_uuid: UUID (foreign key to obelix_bb)
- title: String (255 chars, optional)
- message: Text (optional)
- is_pinned: Integer (default 0)
- upvotes_count: Integer (default 0)
- downvotes_count: Integer (default 0)
- score: Integer (default 0)
- is_nsfw: Boolean (default false)
- is_spoiler: Boolean (default false)
- is_locked: Boolean (default false)
- post_type: Integer (default 0)
- link_type: String (optional)
- link_data: String (optional)
- reply_count: Integer (default 0)
- created_at: DateTime
- updated_at: DateTime
- slug: String (255 chars, optional)
- post_views: Integer (default 0)
- last_reply_id: Integer (optional)

# New fields
- formatted_content: Text (optional) - Rendered HTML/markdown
- format_type: String (default "text") - "text", "markdown", "html"
- attachments: JSON (optional) - List of attachment UUIDs
- mentions: JSON (optional) - List of mentioned user UUIDs
- reactions: JSON (optional) - e.g. {"👍": 5, "👎": 2, "❤️": 3}
- edit_history: JSON (optional) - List of edit timestamps and users
- is_edited: Boolean (default false)
- is_featured: Boolean (default false)
- is_announcement: Boolean (default false)
- is_archived: Boolean (default false)
- meta_data: JSON (optional) - For extensibility
```

#### ObelixBBReply (Replies)

```
- id: Integer (primary key, auto-increment)
- post_id: Integer (foreign key to obelix_bb_post)
- user_uuid: UUID (foreign key to user)
- board_uuid: UUID (foreign key to obelix_bb)
- in_reply_to: Integer (foreign key to obelix_bb_reply, optional)
- message: Text (optional)
- upvotes_count: Integer (default 0)
- downvotes_count: Integer (default 0)
- score: Integer (default 0)
- created_at: DateTime
- updated_at: DateTime

# New fields
- formatted_content: Text (optional) - Rendered HTML/markdown
- format_type: String (default "text") - "text", "markdown", "html"
- attachments: JSON (optional) - List of attachment UUIDs
- mentions: JSON (optional) - List of mentioned user UUIDs
- reactions: JSON (optional) - e.g. {"👍": 5, "👎": 2, "❤️": 3}
- edit_history: JSON (optional) - List of edit timestamps and users
- is_edited: Boolean (default false)
- is_solution: Boolean (default false) - Marked as answer
- is_hidden: Boolean (default false) - Moderator hidden
- meta_data: JSON (optional) - For extensibility
```

#### ObelixBBUpvotes (Votes)

```
- id: Integer (primary key, auto-increment)
- post_id: Integer (foreign key to obelix_bb_post, optional)
- reply_id: Integer (foreign key to obelix_bb_reply, optional)
- user_uuid: UUID (foreign key to user)
- value: Integer (default 0)
- created_at: DateTime
- updated_at: DateTime
```

### New Tables

#### ObelixBBTag (Tags)

```
- id: Integer (primary key, auto-increment)
- realm_uuid: UUID (foreign key to realm)
- name: String (50 chars)
- slug: String (50 chars)
- color: String (20 chars, optional)
- description: String (255 chars, optional)
- created_at: DateTime
- updated_at: DateTime
- usage_count: Integer (default 0)
```

#### Post-Tag Association

```
- post_id: Integer (foreign key to obelix_bb_post)
- tag_id: Integer (foreign key to obelix_bb_tag)
```

#### ObelixBBReaction (Reactions)

```
- id: Integer (primary key, auto-increment)
- post_id: Integer (foreign key to obelix_bb_post, optional)
- reply_id: Integer (foreign key to obelix_bb_reply, optional)
- user_uuid: UUID (foreign key to user)
- emoji: String (20 chars)
- created_at: DateTime
```

#### ObelixBBSubscription (Subscriptions)

```
- id: Integer (primary key, auto-increment)
- user_uuid: UUID (foreign key to user)
- board_uuid: UUID (foreign key to obelix_bb, optional)
- post_id: Integer (foreign key to obelix_bb_post, optional)
- created_at: DateTime
- last_read_at: DateTime
- notification_level: Integer (0=none, 1=mentions, 2=all)
```

#### ObelixBBNotification (Notifications)

```
- id: Integer (primary key, auto-increment)
- user_uuid: UUID (foreign key to user) - Recipient
- actor_uuid: UUID (foreign key to user) - Actor
- type: String (50 chars) - Type of notification
- board_uuid: UUID (foreign key to obelix_bb, optional)
- post_id: Integer (foreign key to obelix_bb_post, optional)
- reply_id: Integer (foreign key to obelix_bb_reply, optional)
- data: JSON (optional) - Additional data
- created_at: DateTime
- is_read: Boolean (default false)
- read_at: DateTime (optional)
```

#### ObelixBBDraft (Drafts)

```
- id: Integer (primary key, auto-increment)
- user_uuid: UUID (foreign key to user)
- board_uuid: UUID (foreign key to obelix_bb, optional)
- post_id: Integer (foreign key to obelix_bb_post, optional)
- title: String (255 chars, optional)
- content: Text (optional)
- format_type: String (default "text")
- created_at: DateTime
- updated_at: DateTime
- is_reply: Boolean (default false)
- meta_data: JSON (optional)
```

## API Routes

### Original Admin Routes

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| GET | `/Realm/:realmUUID/ObelixBB` | `ObelixBBListRoute` | List all boards in a realm |
| GET | `/Realm/ObelixBB/:bbUUID` | `ObelixBBByUUIDRoute` | Get a specific board by UUID |
| POST | `/Realm/ObelixBB` | `ObelixBBCreateRoute` | Create a new board |
| PATCH | `/Realm/ObelixBB/:bbUUID` | `ObelixBBUpdateRoute` | Update a board's details |
| DELETE | `/Realm/ObelixBB/:bbUUID` | `ObelixBBDeleteRoute` | Delete a board and all its posts/replies |

### Original Public Routes

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| GET | `/ObelixBB` | `ObelixBBListPublicRoute` | List all boards in the current realm |
| GET | `/ObelixBB/:bbUUID` | `ObelixBBListAllPostsPublicRoute` | List all posts in a board |
| GET | `/ObelixBB/:bbUUID/:order` | `ObelixBBListAllPostsPublicRoute` | List all posts in a board with specific ordering |
| POST | `/ObelixBB/:bbUUID` | `ObelixBBPostInBoardPublicRoute` | Create a new post in a board |
| PATCH | `/ObelixBB/_Patch/:bbUUID` | `PatchTitleAndMessagePostPublicRoute` | Update a post's title and message |
| DELETE | `/ObelixBB/Post/:postID` | `ObelixBBDeletePostPublicRoute` | Delete a post |
| GET | `/ObelixBB/:bbUUID/Post/:postSlug` | `ObelixBBListRepliesInPostPublicRoute` | Get post details and board info |
| POST | `/ObelixBB/Reply/:postSlug` | `ObelixBBReplyToPostPublicRoute` | Reply to a post |
| GET | `/ObelixBB/:bbUUID/Replies/:postSlug` | `ObelixBBGetRepliesPublicRoute` | Get all replies for a post in a threaded format |
| GET | `/ObelixBB/:bbUUID/RepliesClassic/:postSlug` | `ObelixBBGetRepliesClassicPublicRoute` | Get all replies for a post in classic pagination format |
| POST | `/ObelixBB/Vote/:type/:object/:id` | `ObelixBBVotePublicRoute` | Upvote or downvote a post or reply |
| GET | `/ObelixBB/UserData` | `ObelixBBGetExistingVotesPublicRoute` | Get user's votes data |
| GET | `/ObelixBB/_LastPinned` | `GetLast5PinnedPosts` | Get the last 5 pinned posts in the realm |

### New Admin Routes (Tags)

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| GET | `/Realm/:realmUUID/ObelixBB/Tag` | `ObelixBBTagsListRoute` | List all tags in a realm |
| POST | `/Realm/:realmUUID/ObelixBB/Tag` | `ObelixBBTagCreateRoute` | Create a new tag |
| PATCH | `/Realm/ObelixBB/Tag/:tagID` | `ObelixBBTagUpdateRoute` | Update a tag |
| DELETE | `/Realm/ObelixBB/Tag/:tagID` | `ObelixBBTagDeleteRoute` | Delete a tag |

### New Public Routes (Tags)

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| GET | `/ObelixBB/Tag/Search` | `ObelixBBSearchTagsPublicRoute` | Search for tags |
| GET | `/ObelixBB/Tag/Popular` | `ObelixBBPopularTagsPublicRoute` | Get popular tags |
| GET | `/ObelixBB/Post/:postID/Tags` | `ObelixBBGetPostTagsPublicRoute` | Get tags for a post |
| POST | `/ObelixBB/Post/Tags` | `ObelixBBPostAddTagsPublicRoute` | Add tags to a post |

### New Public Routes (Reactions)

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| POST | `/ObelixBB/Reaction` | `ObelixBBReactionAddPublicRoute` | Add/remove a reaction |
| GET | `/ObelixBB/Reactions` | `ObelixBBUserReactionsPublicRoute` | Get user's reactions |

### New Public Routes (Subscriptions)

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| POST | `/ObelixBB/Subscribe` | `ObelixBBSubscribePublicRoute` | Subscribe to a board/post |
| DELETE | `/ObelixBB/Unsubscribe/:subscriptionID` | `ObelixBBUnsubscribePublicRoute` | Unsubscribe |
| PATCH | `/ObelixBB/Subscription/:subscriptionID` | `ObelixBBUpdateSubscriptionPublicRoute` | Update subscription |
| GET | `/ObelixBB/Subscriptions` | `ObelixBBGetUserSubscriptionsPublicRoute` | Get user's subscriptions |
| POST | `/ObelixBB/Thread/MarkRead` | `ObelixBBMarkThreadReadPublicRoute` | Mark thread as read |

### New Public Routes (Notifications)

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| GET | `/ObelixBB/Notifications` | `ObelixBBGetUserNotificationsPublicRoute` | Get notifications |
| POST | `/ObelixBB/Notification/:notificationID/MarkRead` | `ObelixBBMarkNotificationReadPublicRoute` | Mark notification as read |
| POST | `/ObelixBB/Notifications/MarkAllRead` | `ObelixBBMarkAllNotificationsReadPublicRoute` | Mark all notifications as read |
| GET | `/ObelixBB/Notifications/UnreadCount` | `ObelixBBGetUnreadNotificationCountPublicRoute` | Get unread count |

### New Public Routes (Drafts)

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| POST | `/ObelixBB/Draft` | `ObelixBBSaveDraftPublicRoute` | Save a draft |
| GET | `/ObelixBB/Draft` | `ObelixBBGetDraftPublicRoute` | Get a specific draft |
| DELETE | `/ObelixBB/Draft/:draftID` | `ObelixBBDeleteDraftPublicRoute` | Delete a draft |
| GET | `/ObelixBB/Drafts` | `ObelixBBGetUserDraftsPublicRoute` | Get all user drafts |

### New Public Routes (Enhanced Post Features)

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| POST | `/ObelixBB/Post/:postID/SetFeatured` | `ObelixBBSetPostFeaturePublicRoute` | Set post as featured |
| POST | `/ObelixBB/Post/:postID/SetAnnouncement` | `ObelixBBSetPostAnnouncementPublicRoute` | Set post as announcement |
| POST | `/ObelixBB/Reply/:replyID/SetSolution` | `ObelixBBMarkReplyAsSolutionPublicRoute` | Mark reply as solution |
| GET | `/ObelixBB/FeaturedPosts` | `ObelixBBGetFeaturedPostsPublicRoute` | Get featured posts |
| GET | `/ObelixBB/Announcements` | `ObelixBBGetAnnouncementsPublicRoute` | Get announcements |

## Key Functions

### Board Operations

- **Insert**: Create a new board
- **Delete**: Delete a board and all its posts/replies
- **Update**: Update board details
- **GetBoardByUUID**: Retrieve a board by UUID
- **GetAllBB**: Get all boards with filtering and pagination
- **GetAllBBInRealm**: Get all boards in a specific realm
- **UpdateCounts**: Update post and reply counts for a board

### Post Operations

- Post creation with optional title, message, and metadata
- Post modification (updating title/message)
- Post deletion
- Toggle post status (pinned, NSFW, spoiler, locked)
- Post upvote/downvote system
- **FormatAndSavePostMessage**: Format and save post message with proper formatting
- **SearchPosts**: Search for posts by title/content
- **GetFeaturedPostsByRealm**: Get featured posts in a realm
- **GetAnnouncementsByRealm**: Get announcement posts in a realm

### Reply Operations

- Reply creation with support for nested replies
- Reply upvote/downvote system
- Classic pagination and threaded views for replies
- **FormatAndSaveReplyMessage**: Format and save reply with proper formatting
- **MarkReplyAsSolution**: Mark a reply as the solution to a post

### Tag Operations

- **GetTagByID**: Get a tag by ID
- **GetTagBySlug**: Get a tag by slug
- **GetAllTags**: Get all tags with pagination
- **SearchTags**: Search for tags by name/slug
- **GetPopularTags**: Get most popular tags
- **GetTagsForPost**: Get all tags for a post
- **AddTagToPost**: Add a tag to a post
- **RemoveTagFromPost**: Remove a tag from a post
- **UpdatePostTags**: Update all tags for a post

### Reaction Operations

- **ToggleReaction**: Add/remove a reaction
- **GetUserReactions**: Get user's reactions
- **GetReactionsByPost**: Get reactions for a post
- **GetReactionsByReply**: Get reactions for a reply

### Subscription Operations

- **GetUserBoardSubscription**: Get user's subscription to a board
- **GetUserPostSubscription**: Get user's subscription to a post
- **GetUserSubscriptions**: Get all subscriptions for a user
- **UpdateLastReadAt**: Update the last read time for a subscription
- **IsUserSubscribedToBoard**: Check if user is subscribed to a board
- **IsUserSubscribedToPost**: Check if user is subscribed to a post

### Notification Operations

- **GetUserNotifications**: Get user's notifications
- **MarkAsRead**: Mark notification as read
- **MarkAllUserNotificationsAsRead**: Mark all notifications as read
- **GetUnreadNotificationCount**: Get count of unread notifications
- **CreateMentionNotifications**: Create notifications for @mentions
- **GetUserRecentNotifications**: Get recent notifications for a user

### Draft Operations

- **GetUserDraft**: Get user draft for a board/post
- **GetUserDrafts**: Get all drafts for a user
- **SaveOrUpdateDraft**: Save a new draft or update existing
- **DeleteAllUserDrafts**: Delete all drafts for a user
- **GetUserDraftCount**: Get count of drafts for a user

## Permission System

- Admin operations require admin permissions for the realm
- Posts can only be deleted by the post author or realm admins
- Post status toggles have specific permissions:
  - Pin: Post author or admin
  - NSFW: Post author or admin
  - Spoiler: Post author or admin
  - Lock: Admin only
  - Featured: Admin only
  - Announcement: Admin only
- Solution marking requires post author or admin
- Locked posts cannot receive new replies
- Tag management (create, update, delete) requires admin
- Users can only manage their own subscriptions, drafts, and notification preferences

## Content Formatting

- Supports plain text, Markdown, and HTML
- Sanitizes HTML content for security
- Automatically detects and processes @mentions
- Preserves formatting in drafts
- Renders formatted content for display
- Syntax highlighting for code blocks
- Link embeds and media previews

## Notification System

- Notification types:
  - post_mention: User mentioned in post
  - reply_mention: User mentioned in reply
  - post_reaction: Reaction to user's post
  - reply_reaction: Reaction to user's reply
  - reply_solution: Reply marked as solution
- Notification level settings:
  - 0: No notifications
  - 1: Mentions only (default)
  - 2: All activity
- Marks last read position in threads
- Tracks read/unread status

## React Emoji System

- Beyond traditional upvote/downvote
- Supports any Unicode emoji
- Shows reaction counts
- Allows toggling reactions
- Groups reactions by type
- Notifies users of reactions to their content

## Statistics

- Board statistics: post_count, reply_count, last_post_id
- Post statistics: upvotes_count, downvotes_count, score, reply_count, post_views, last_reply_id
- Reply statistics: upvotes_count, downvotes_count, score
- User statistics: Votes and reactions are tracked per user
- Tag statistics: usage_count
- Subscription counts: GetBoardSubscriberCount, GetPostSubscriberCount
- Notification statistics: unread counts